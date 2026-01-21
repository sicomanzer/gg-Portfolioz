import { GoogleGenAI, Type } from "@google/genai";
import { Stock } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchStockData = async (symbol: string): Promise<Partial<Stock>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the latest real-time financial market data for the stock symbol "${symbol}".
      Focus on the primary listing exchange. If the symbol is a Thai stock (e.g. PTT, AOT, DELTA, KBANK), prioritize the Stock Exchange of Thailand (SET) data. If it is a global stock, use the major exchange (NASDAQ, NYSE).
      
      Extract the following specific values:
      1. Current Stock Price
      2. P/E Ratio (Price-to-Earnings)
      3. P/BV Ratio (Price-to-Book Value)
      4. Debt to Equity Ratio (D/E)
      5. Return on Equity (ROE) as a percentage (e.g. 15 for 15%)
      6. Earnings Per Share (EPS)
      7. Latest Annual Dividend Amount (per share in local currency)

      Return valid JSON only. Use 0 if a specific value is unavailable after searching.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            price: { type: Type.NUMBER },
            pe: { type: Type.NUMBER },
            pbv: { type: Type.NUMBER },
            de: { type: Type.NUMBER },
            roe: { type: Type.NUMBER },
            eps: { type: Type.NUMBER },
            dividend: { type: Type.NUMBER },
          },
          required: ['price', 'pe', 'pbv', 'de', 'roe', 'eps', 'dividend'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI service");
    
    const data = JSON.parse(text);
    
    // Extract sources from grounding metadata to display to the user
    // The type definition for groundingChunks might vary, we map safely
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
          if (chunk.web) {
              return { title: chunk.web.title, uri: chunk.web.uri };
          }
          return null;
      })
      .filter((s: any) => s !== null) || [];

    return {
      price: data.price,
      pe: data.pe,
      pbv: data.pbv,
      de: data.de,
      roe: data.roe,
      eps: data.eps,
      dividendBaht: data.dividend,
      yieldPercent: data.price > 0 ? (data.dividend / data.price) * 100 : 0,
      sources: sources
    };
  } catch (error) {
    console.error("Failed to fetch stock data:", error);
    throw error;
  }
};