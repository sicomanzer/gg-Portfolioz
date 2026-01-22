
import { GoogleGenAI, Type } from "@google/genai";
import { Stock } from '../types';

export const fetchStockData = async (symbol: string): Promise<Partial<Stock>> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Missing API_KEY. Please set it in your environment variables.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const currentYear = new Date().getFullYear();
    const targetFiscalYear = currentYear - 1;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded for better financial reasoning
      contents: `Search and extract financial data for stock symbol "${symbol}" specifically for the FULL FISCAL YEAR (FY${targetFiscalYear}).
      
      Required Data:
      1. Current Market Price (latest available)
      2. P/E Ratio (full-year basis)
      3. P/BV Ratio
      4. Debt to Equity Ratio (D/E)
      5. Return on Equity (ROE) %
      6. Earnings Per Share (EPS) for the full fiscal year
      7. Total Annual Dividend per share paid for that year (D0)
      8. Confirmation of the data year (e.g., "${targetFiscalYear}")

      Note: If the company pays dividends multiple times a year, sum them up for the annual dividend.
      Return as valid JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentPrice: { type: Type.NUMBER },
            pe: { type: Type.NUMBER },
            pbv: { type: Type.NUMBER },
            de: { type: Type.NUMBER },
            roe: { type: Type.NUMBER },
            eps: { type: Type.NUMBER },
            dividend: { type: Type.NUMBER },
            referenceYear: { type: Type.STRING },
          },
          required: ['currentPrice', 'pe', 'pbv', 'de', 'roe', 'eps', 'dividend', 'referenceYear'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI service");
    
    const data = JSON.parse(text);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
          if (chunk.web) {
              return { title: chunk.web.title, uri: chunk.web.uri };
          }
          return null;
      })
      .filter((s: any) => s !== null) || [];

    return {
      price: data.currentPrice,
      pe: data.pe,
      pbv: data.pbv,
      de: data.de,
      roe: data.roe,
      eps: data.eps,
      dividendBaht: data.dividend,
      yieldPercent: data.currentPrice > 0 ? (data.dividend / data.currentPrice) * 100 : 0,
      sources: sources,
      referenceYear: data.referenceYear
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Return a more user-friendly error message
    const errorMessage = error.message?.includes("API key") 
      ? "Invalid/Missing API Key" 
      : error.message?.includes("not found") 
      ? "Stock not found" 
      : "Service Unavailable";
    throw new Error(errorMessage);
  }
};
