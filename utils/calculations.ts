
import { Stock, CalculationResult } from '../types';

export const calculateDDM = (
  stock: Stock, 
  moneyPerCompany: number
): CalculationResult => {
  const { dividendBaht, growth, requiredReturn } = stock;
  
  // Gordon Growth Model: P = D1 / (r - g)
  // D1 = D0 * (1 + g)
  
  // Convert percentages to decimals
  const g = (growth || 0) / 100;
  const r = (requiredReturn || 0) / 100;

  // Basic check for missing inputs
  if (!dividendBaht || dividendBaht <= 0) {
    return {
      d1: 0,
      ddmPrice: 0,
      mos30: 0,
      mos40: 0,
      mos50: 0,
      maxShares30: 0,
      maxShares40: 0,
      maxShares50: 0,
      isValid: false,
      errorReason: 'No Div'
    };
  }

  const d1 = dividendBaht * (1 + g);

  // Model Validity Check: If growth is greater than or equal to required return, 
  // the denominator is zero or negative, making the formula invalid for a steady-state model.
  if (r <= g) {
    return {
      d1,
      ddmPrice: 0,
      mos30: 0,
      mos40: 0,
      mos50: 0,
      maxShares30: 0,
      maxShares40: 0,
      maxShares50: 0,
      isValid: false,
      errorReason: 'r ≤ g'
    };
  }

  // Calculation
  const fairPrice = d1 / (r - g);
  
  const mos30 = fairPrice * 0.7;
  const mos40 = fairPrice * 0.6;
  const mos50 = fairPrice * 0.5;

  return {
    d1,
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

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val: number | undefined): string => {
  if (val === undefined || isNaN(val)) return '0.00';
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
