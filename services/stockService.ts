
import { GoogleGenAI, Type } from "@google/genai";
import { Stock } from '../types';

export const fetchStockData = async (symbol: string): Promise<Partial<Stock>> => {
  // สร้าง Instance ใหม่ทุกครั้งเพื่อให้ใช้ Key ล่าสุดที่อาจถูกเลือกใหม่
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const targetFiscalYear = new Date().getFullYear() - 1;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a financial analyst. Search for the stock "${symbol}" on the Stock Exchange of Thailand (SET).
      
      Find and provide the following data for the FULL FISCAL YEAR ${targetFiscalYear}:
      1. Latest Market Price (in THB)
      2. P/E Ratio
      3. P/BV Ratio
      4. Debt to Equity Ratio (D/E)
      5. Return on Equity (ROE) as a percentage
      6. Earnings Per Share (EPS)
      7. Total Annual Dividend per share paid for the year ${targetFiscalYear}
      8. Confirm the year of data (should be ${targetFiscalYear})
      9. The English Company Name (brief, e.g. "PTT Public Company Limited" or "PTT")

      Return ONLY a JSON object.`,
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
            companyName: { type: Type.STRING },
          },
          required: ['currentPrice', 'pe', 'pbv', 'de', 'roe', 'eps', 'dividend', 'referenceYear', 'companyName'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty content");
    
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
      price: data.currentPrice || 0,
      pe: data.pe || 0,
      pbv: data.pbv || 0,
      de: data.de || 0,
      roe: data.roe || 0,
      eps: data.eps || 0,
      dividendBaht: data.dividend || 0,
      yieldPercent: (data.currentPrice > 0 && data.dividend > 0) ? (data.dividend / data.currentPrice) * 100 : 0,
      sources: sources,
      referenceYear: data.referenceYear || targetFiscalYear.toString(),
      companyName: data.companyName || ''
    };
  } catch (error: any) {
    console.error("Stock Fetch Error:", error);
    // ตรวจสอบ Error พิเศษหาก API Key มีปัญหา
    if (error.message?.includes("API key not found") || error.message?.includes("invalid")) {
        throw new Error("API Key Error: Please re-select your key.");
    }
    throw new Error(error.message || "Failed to fetch data");
  }
};
