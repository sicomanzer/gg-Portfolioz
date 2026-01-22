
import { GoogleGenAI, Type } from "@google/genai";
import { Stock } from '../types';

export const fetchStockData = async (symbol: string): Promise<Partial<Stock>> => {
  try {
    // Create instance inside function to avoid top-level 'process is not defined' error
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const currentYear = new Date().getFullYear();
    const targetFiscalYear = currentYear - 1;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the financial data for stock symbol "${symbol}" for the PREVIOUS COMPLETED FULL FISCAL YEAR (FY${targetFiscalYear}).
      
      IMPORTANT: Do not use real-time or interim (Q1, Q2, Q3) data. We need the audited full-year values from the most recently concluded fiscal year (e.g., if today is in 2025, get data from 2024).
      
      Extract:
      1. Current Market Price (as of today)
      2. P/E Ratio (based on full-year earnings)
      3. P/BV Ratio
      4. Debt to Equity Ratio (D/E)
      5. Return on Equity (ROE) %
      6. Earnings Per Share (EPS) for the full year
      7. Total Annual Dividend Paid per share (Sum of all dividends paid for that fiscal year)
      8. The actual Year of this data (e.g., "2024")

      Return valid JSON only.`,
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
  } catch (error) {
    console.error("Failed to fetch stock data:", error);
    throw error;
  }
};
