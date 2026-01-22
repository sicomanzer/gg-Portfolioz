
export interface Stock {
  id: string;
  symbol: string;
  price: number;
  pe: number;
  pbv: number;
  de: number;
  roe: number;
  eps: number;
  dividendBaht: number;
  yieldPercent: number;
  growth: number;
  requiredReturn: number;
  loading: boolean;
  error?: string;
  sources?: { title: string; uri: string }[];
  referenceYear?: string;
}

export interface PortfolioSettings {
  totalCapital: number;
  companyCount: number;
}

export interface CalculationResult {
  d1: number;
  yieldForecast: number;
  ddmPrice: number;
  mos30: number;
  mos40: number;
  mos50: number;
  maxShares30: number;
  maxShares40: number;
  maxShares50: number;
  isValid: boolean;
  errorReason?: string;
}
