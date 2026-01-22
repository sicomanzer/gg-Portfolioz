import React, { useMemo } from 'react';
import { Stock } from '../types';
import { calculateDDM, formatCurrency, formatNumber } from '../utils/calculations';
import { TrashIcon, RefreshIcon, AlertCircleIcon, InfoIcon } from './Icons';

interface Props {
  stock: Stock;
  moneyPerCompany: number;
  onUpdate: (id: string, updates: Partial<Stock>) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string, symbol: string) => void;
}

const StockRow: React.FC<Props> = ({ stock, moneyPerCompany, onUpdate, onDelete, onRefresh }) => {
  // Memoize results to avoid re-calc on every render
  const result = useMemo(() => calculateDDM(stock, moneyPerCompany), [stock, moneyPerCompany]);

  // Handlers for inputs
  const handleChange = (field: keyof Stock, value: string | number) => {
    onUpdate(stock.id, { [field]: value, error: undefined }); // Clear error on change
  };

  // Two-way binding logic handlers
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    const newYield = val > 0 ? (stock.dividendBaht / val) * 100 : 0;
    onUpdate(stock.id, { price: val, yieldPercent: newYield });
  };

  const handleDividendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    const newYield = stock.price > 0 ? (val / stock.price) * 100 : 0;
    onUpdate(stock.id, { dividendBaht: val, yieldPercent: newYield });
  };

  const handleYieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    const newDividend = stock.price * (val / 100);
    onUpdate(stock.id, { yieldPercent: val, dividendBaht: newDividend });
  };

  const handleSymbolKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRefresh(stock.id, stock.symbol);
    }
  };

  const inputClass = `w-full bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-1 text-sm font-medium transition-all ${
    stock.loading ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'
  }`;
  const readOnlyClass = `w-full text-center text-sm py-1 transition-colors ${
    stock.loading ? 'text-slate-300' : 'text-slate-500'
  }`;
  
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      {/* Symbol */}
      <td className="p-2 border-r border-slate-100 relative min-w-[120px]">
        <div className="relative">
            <input
            type="text"
            value={stock.symbol}
            disabled={stock.loading}
            onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
            onKeyDown={handleSymbolKeyDown}
            className={`w-full font-bold text-center uppercase focus:outline-none focus:ring-2 rounded px-2 py-1 transition-colors ${
              stock.loading ? 'text-slate-300 cursor-not-allowed bg-slate-50/50' : 'text-slate-800'
            } ${stock.error ? 'ring-2 ring-red-400 focus:ring-red-500' : 'focus:ring-blue-500'}`}
            placeholder="SYMBOL"
            />
            
            {/* Year Badge or Error Message */}
            <div className="text-[10px] font-bold text-center mt-0.5 min-h-[14px]">
              {!stock.loading && stock.error ? (
                <span className="text-red-500">{stock.error}</span>
              ) : !stock.loading && stock.referenceYear ? (
                <span className="text-slate-400">FY {stock.referenceYear}</span>
              ) : stock.loading ? (
                <span className="text-blue-400 animate-pulse uppercase tracking-widest text-[9px]">Fetching...</span>
              ) : null}
            </div>

            {stock.loading && (
                <span className="absolute right-1 top-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-bounce">Wait</span>
            )}
            
            {/* Sources Tooltip */}
            {!stock.loading && stock.sources && stock.sources.length > 0 && (
              <div className="absolute top-1 right-1 group/source">
                <div className="cursor-help text-blue-300 hover:text-blue-500 p-1">
                   <InfoIcon className="w-3 h-3" />
                </div>
                <div className="hidden group-hover/source:block absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-50 text-xs text-left">
                  <div className="font-semibold text-slate-700 mb-1 px-1 border-b border-slate-100 pb-1">Data Sources</div>
                  <div className="max-h-32 overflow-y-auto">
                  {stock.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block px-1 py-1.5 hover:bg-slate-50 text-blue-600 truncate rounded transition-colors"
                      title={source.title}
                    >
                      {source.title || 'Source ' + (idx + 1)}
                    </a>
                  ))}
                  </div>
                </div>
              </div>
            )}
        </div>
      </td>

      {/* Market Data */}
      <td className="p-2 border-r border-slate-100">
        <input type="number" step="0.01" value={stock.price || ''} disabled={stock.loading} onChange={handlePriceChange} className={inputClass} placeholder="0.00" />
      </td>
      <td className="p-2 border-r border-slate-100"><div className={readOnlyClass}>{formatNumber(stock.pe)}</div></td>
      <td className="p-2 border-r border-slate-100"><div className={readOnlyClass}>{formatNumber(stock.pbv)}</div></td>
      <td className="p-2 border-r border-slate-100"><div className={readOnlyClass}>{formatNumber(stock.de)}</div></td>
      <td className="p-2 border-r border-slate-100"><div className={readOnlyClass}>{formatNumber(stock.roe)}%</div></td>
      <td className="p-2 border-r border-slate-100"><div className={readOnlyClass}>{formatNumber(stock.eps)}</div></td>

      {/* DDM Inputs */}
      <td className="p-2 bg-blue-50/30 border-r border-slate-100">
        <input type="number" step="0.01" value={stock.dividendBaht ? formatNumber(stock.dividendBaht) : ''} disabled={stock.loading} onChange={handleDividendChange} className={inputClass} placeholder="0.00" />
      </td>
      <td className="p-2 bg-blue-50/30 border-r border-slate-100">
        <input type="number" step="0.01" value={stock.yieldPercent ? formatNumber(stock.yieldPercent) : ''} disabled={stock.loading} onChange={handleYieldChange} className={inputClass} placeholder="0.00" />
      </td>
      <td className="p-2 bg-blue-50/30 border-r border-slate-100">
        <input type="number" step="0.1" value={stock.growth} disabled={stock.loading} onChange={(e) => handleChange('growth', parseFloat(e.target.value))} className={inputClass} />
      </td>
      <td className="p-2 bg-blue-50/30 border-r border-slate-100">
        <input type="number" step="0.1" value={stock.requiredReturn} disabled={stock.loading} onChange={(e) => handleChange('requiredReturn', parseFloat(e.target.value))} className={inputClass} />
      </td>

      {/* Results */}
      <td className={`p-2 font-bold text-center border-r border-slate-100 transition-colors ${
        stock.loading ? 'bg-slate-50 text-slate-300' : result.isValid ? 'text-green-700 bg-green-50/50' : 'text-red-500 bg-red-50'
      }`}>
        {stock.loading ? '...' : result.isValid ? (
          formatNumber(result.ddmPrice)
        ) : (
          <span className="text-[10px] uppercase tracking-tighter" title={result.errorReason}>
            {result.errorReason || 'Invalid'}
          </span>
        )}
      </td>
      
      {/* MOS 30% */}
      <td className="p-2 text-center border-r border-slate-100 bg-green-50/30">
        <div className={`text-sm font-semibold transition-colors ${stock.loading ? 'text-slate-300' : 'text-slate-700'}`}>
          {stock.loading ? '-' : (result.isValid ? formatNumber(result.mos30) : '-')}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {stock.loading ? '-' : (result.isValid ? result.maxShares30.toLocaleString() : '0')} shares
        </div>
      </td>

      {/* MOS 40% */}
      <td className="p-2 text-center border-r border-slate-100 bg-green-100/30">
        <div className={`text-sm font-semibold transition-colors ${stock.loading ? 'text-slate-300' : 'text-slate-700'}`}>
          {stock.loading ? '-' : (result.isValid ? formatNumber(result.mos40) : '-')}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {stock.loading ? '-' : (result.isValid ? result.maxShares40.toLocaleString() : '0')} shares
        </div>
      </td>

      {/* MOS 50% */}
      <td className="p-2 text-center border-r border-slate-100 bg-green-200/30">
        <div className={`text-sm font-semibold transition-colors ${stock.loading ? 'text-slate-300' : 'text-slate-700'}`}>
          {stock.loading ? '-' : (result.isValid ? formatNumber(result.mos50) : '-')}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {stock.loading ? '-' : (result.isValid ? result.maxShares50.toLocaleString() : '0')} shares
        </div>
      </td>

      {/* Actions */}
      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onRefresh(stock.id, stock.symbol)} 
                disabled={stock.loading}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                title="Refresh Data"
            >
                <RefreshIcon className={`w-4 h-4 ${stock.loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={() => onDelete(stock.id)}
                disabled={stock.loading}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Delete Row"
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </td>
    </tr>
  );
};

export default React.memo(StockRow);