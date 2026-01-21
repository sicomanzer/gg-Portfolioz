import React from 'react';
import { PortfolioSettings } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  settings: PortfolioSettings;
  onSettingsChange: (newSettings: PortfolioSettings) => void;
  onSave: () => void;
  isSaved: boolean;
}

const PortfolioSummary: React.FC<Props> = ({ settings, onSettingsChange, onSave, isSaved }) => {
  const moneyPerCompany = settings.companyCount > 0 
    ? settings.totalCapital / settings.companyCount 
    : 0;

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    onSettingsChange({ ...settings, totalCapital: val });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    onSettingsChange({ ...settings, companyCount: Math.max(1, val) });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total Capital (THB)</label>
            <input
              type="number"
              value={settings.totalCapital}
              onChange={handleCapitalChange}
              className="text-2xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-blue-500 outline-none transition-colors py-1 bg-transparent"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Companies</label>
            <div className="flex items-center">
              <input
                type="number"
                min="1"
                max="100"
                value={settings.companyCount}
                onChange={handleCountChange}
                className="text-2xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-blue-500 outline-none transition-colors py-1 w-20 bg-transparent text-center"
              />
              <span className="ml-3 text-slate-400">stocks</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Money per Company</label>
            <div className="text-2xl font-bold text-green-600 py-1">
              ฿ {formatCurrency(moneyPerCompany)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
