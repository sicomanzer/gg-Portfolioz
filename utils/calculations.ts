import { Stock, CalculationResult } from '../types';

export const calculateDDM = (
  stock: Stock, 
  moneyPerCompany: number
): CalculationResult => {
  const { dividendBaht, growth, requiredReturn } = stock;
  
  // DDM Formula: P = D1 / (r - g)
  // D1 = D0 * (1 + g)
  
  // Convert percentages to decimals
  const g = growth / 100;
  const r = requiredReturn / 100;

  // Model Validity Check: If g >= r, the model breaks (denominator is 0 or negative)
  if (g >= r) {
    return {
      ddmPrice: 0,
      mos30: 0,
      mos40: 0,
      mos50: 0,
      maxShares30: 0,
      maxShares40: 0,
      maxShares50: 0,
      isValid: false
    };
  }

  const nextDividend = dividendBaht * (1 + g);
  const fairPrice = nextDividend / (r - g);

  const mos30 = fairPrice * 0.7;
  const mos40 = fairPrice * 0.6;
  const mos50 = fairPrice * 0.5;

  return {
    ddmPrice: fairPrice,
    mos30,
    mos40,
    mos50,
    maxShares30: mos30 > 0 ? Math.floor(moneyPerCompany / mos30) : 0,
    maxShares40: mos40 > 0 ? Math.floor(moneyPerCompany / mos40) : 0,
    maxShares50: mos50 > 0 ? Math.floor(moneyPerCompany / mos50) : 0,
    isValid: true
  };
};

export const formatCurrency = (val: number, minimumFractionDigits = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val: number, digits = 2) => {
  return val.toFixed(digits);
};
