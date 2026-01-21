import { Stock } from '../types';
import { MOCK_DELAY_MS } from '../constants';

// In a real Next.js app, this would be an API call to /api/stock/refresh
// which would perform server-side scraping and yahoo-finance2 calls.
// Since we are running in a client-side browser environment for this demo,
// we simulate the data to respect CORS and security policies.

const MOCK_DB: Record<string, Partial<Stock>> = {
  'PTT': { price: 34.50, pe: 10.2, pbv: 0.85, de: 0.65, roe: 9.5, eps: 3.20, dividendBaht: 2.00 },
  'AOT': { price: 65.25, pe: 75.4, pbv: 6.20, de: 1.20, roe: 12.4, eps: 0.85, dividendBaht: 0.40 },
  'DELTA': { price: 78.00, pe: 65.5, pbv: 15.4, de: 0.30, roe: 25.6, eps: 1.10, dividendBaht: 0.60 },
  'KBANK': { price: 125.50, pe: 8.4, pbv: 0.65, de: 0.90, roe: 8.8, eps: 14.50, dividendBaht: 4.50 },
  'ADVANC': { price: 215.00, pe: 22.1, pbv: 7.80, de: 2.50, roe: 32.0, eps: 9.80, dividendBaht: 8.10 },
  'SCC': { price: 254.00, pe: 15.6, pbv: 0.95, de: 0.70, roe: 6.5, eps: 18.20, dividendBaht: 6.00 },
};

export const fetchStockData = async (symbol: string): Promise<Partial<Stock>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const upperSymbol = symbol.toUpperCase();
      const mockData = MOCK_DB[upperSymbol];

      if (mockData) {
        // Known mock data
        resolve({
          ...mockData,
          yieldPercent: (mockData.dividendBaht! / mockData.price!) * 100
        });
      } else {
        // Random generated data for unknown symbols to demonstrate functionality
        const price = Math.random() * 100 + 10;
        const div = price * (Math.random() * 0.05 + 0.01);
        resolve({
          price: price,
          pe: Math.random() * 20 + 5,
          pbv: Math.random() * 3 + 0.5,
          de: Math.random() * 2,
          roe: Math.random() * 15 + 2,
          eps: price / (Math.random() * 15 + 8),
          dividendBaht: div,
          yieldPercent: (div / price) * 100,
        });
      }
    }, MOCK_DELAY_MS);
  });
};