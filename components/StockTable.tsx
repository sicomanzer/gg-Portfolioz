
import React from 'react';
import { Stock, PortfolioSettings } from '../types';
import StockRow from './StockRow';
import { PlusIcon } from './Icons';

interface Props {
  stocks: Stock[];
  settings: PortfolioSettings;
  onUpdateStock: (id: string, updates: Partial<Stock>) => void;
  onDeleteStock: (id: string) => void;
  onAddStock: () => void;
  onRefreshStock: (id: string, symbol: string) => void;
}

const StockTable: React.FC<Props> = ({ 
  stocks, 
  settings, 
  onUpdateStock, 
  onDeleteStock, 
  onAddStock,
  onRefreshStock 
}) => {
  const moneyPerCompany = settings.companyCount > 0 
    ? settings.totalCapital / settings.companyCount 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 border-b border-slate-200">
              <th className="p-3 text-center font-bold w-24 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Symbol</th>
              <th className="p-3 text-center w-24 border-r border-slate-200">Price</th>
              <th className="p-3 text-center w-16 border-r border-slate-200">P/E</th>
              <th className="p-3 text-center w-16 border-r border-slate-200">P/BV</th>
              <th className="p-3 text-center w-16 border-r border-slate-200">D/E</th>
              <th className="p-3 text-center w-16 border-r border-slate-200">ROE%</th>
              <th className="p-3 text-center w-16 border-r border-slate-200">EPS</th>
              <th className="p-3 text-center w-24 border-r border-slate-200 bg-blue-50/50 text-blue-800">
                Div (฿) <br/><span className="text-[9px] opacity-60">(D0)</span>
              </th>
              <th className="p-3 text-center w-20 border-r border-slate-200 bg-blue-50/50 text-blue-800">
                Yield % <br/><span className="text-[9px] opacity-60">(Y0)</span>
              </th>
              <th className="p-3 text-center w-20 border-r border-slate-200 bg-blue-50/50 text-blue-800">
                Growth % <br/><span className="text-[9px] opacity-60">(g)</span>
              </th>
              <th className="p-3 text-center w-20 border-r border-slate-200 bg-blue-50/50 text-blue-800">
                Req. Ret % <br/><span className="text-[9px] opacity-60">(r)</span>
              </th>
              <th className="p-3 text-center w-24 border-r border-slate-200 bg-green-50/80 text-green-800">Fair Price (DDM)</th>
              <th className="p-3 text-center w-24 border-r border-slate-200 bg-green-50/50">MOS 30%</th>
              <th className="p-3 text-center w-24 border-r border-slate-200 bg-green-100/50">MOS 40%</th>
              <th className="p-3 text-center w-24 border-r border-slate-200 bg-green-200/50">MOS 50%</th>
              <th className="p-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {stocks.length === 0 ? (
                <tr>
                    <td colSpan={16} className="p-12 text-center text-slate-400">
                        No stocks added yet. Click "Add Stock" to begin.
                    </td>
                </tr>
            ) : (
                stocks.map(stock => (
                <StockRow 
                    key={stock.id} 
                    stock={stock} 
                    moneyPerCompany={moneyPerCompany}
                    onUpdate={onUpdateStock}
                    onDelete={onDeleteStock}
                    onRefresh={onRefreshStock}
                />
                ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <button 
          onClick={onAddStock}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Add Stock
        </button>
      </div>
    </div>
  );
};

export default StockTable;
