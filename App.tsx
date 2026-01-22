
import React, { useState, useEffect, useCallback } from 'react';
import { Stock, PortfolioSettings } from './types';
import { DEFAULT_GROWTH, DEFAULT_REQ_RETURN, INITIAL_PORTFOLIO_SETTINGS } from './constants';
import PortfolioSummary from './components/PortfolioSummary';
import StockTable from './components/StockTable';
import { fetchStockData } from './services/stockService';
import { SaveIcon, RefreshIcon, AlertCircleIcon } from './components/Icons';

function App() {
  const [settings, setSettings] = useState<PortfolioSettings>(INITIAL_PORTFOLIO_SETTINGS);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  
  // API Key State
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      // 1. Check if process.env.API_KEY already exists (from Vercel)
      if (process.env.API_KEY && process.env.API_KEY.length > 5) {
        setHasKey(true);
        return;
      }

      // 2. Check via window.aistudio if available
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Fallback or development environment
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race conditions
      setHasKey(true);
    } else {
      alert("API Key Selection is not available in this environment. Please set API_KEY in environment variables.");
    }
  };

  // Load from local storage
  useEffect(() => {
    if (hasKey) {
      const savedData = localStorage.getItem('portfolio_data');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.stocks) setStocks(parsed.stocks);
        } catch (e) {
          console.error("Failed to load portfolio", e);
        }
      } else if (stocks.length === 0) {
          handleAddStock();
      }
    }
  }, [hasKey]);

  const handleSave = () => {
    setIsSaving(true);
    const data = { settings, stocks };
    localStorage.setItem('portfolio_data', JSON.stringify(data));
    setTimeout(() => {
        setIsSaved(true);
        setIsSaving(false);
    }, 500);
  };

  const markUnsaved = () => {
    if (isSaved) setIsSaved(false);
  };

  const handleSettingsChange = (newSettings: PortfolioSettings) => {
    setSettings(newSettings);
    markUnsaved();
  };

  const handleAddStock = () => {
    const newStock: Stock = {
      id: crypto.randomUUID(),
      symbol: '',
      price: 0,
      pe: 0,
      pbv: 0,
      de: 0,
      roe: 0,
      eps: 0,
      dividendBaht: 0,
      yieldPercent: 0,
      growth: DEFAULT_GROWTH,
      requiredReturn: DEFAULT_REQ_RETURN,
      loading: false,
    };
    setStocks(prev => [...prev, newStock]);
    markUnsaved();
  };

  const handleDeleteStock = (id: string) => {
    if(confirm('Are you sure you want to delete this stock?')) {
        setStocks(prev => prev.filter(s => s.id !== id));
        markUnsaved();
    }
  };

  const handleUpdateStock = useCallback((id: string, updates: Partial<Stock>) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    markUnsaved();
  }, [isSaved]);

  const handleRefreshStock = async (id: string, symbol: string) => {
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      handleUpdateStock(id, { error: 'Symbol required' });
      return;
    }
    
    handleUpdateStock(id, { symbol: trimmedSymbol, loading: true, error: undefined });

    try {
      const data = await fetchStockData(trimmedSymbol);
      handleUpdateStock(id, { ...data, loading: false });
    } catch (error: any) {
      // Check for specific API Key error to prompt re-selection
      if (error.message?.includes("entity was not found") || error.message?.includes("API Key")) {
        setHasKey(false);
      }
      handleUpdateStock(id, { loading: false, error: error.message || 'Fetch failed' });
    }
  };

  const handleRefreshAll = async () => {
    const stocksToRefresh = stocks.filter(s => s.symbol.trim() !== '');
    if (stocksToRefresh.length === 0) return;
    setIsRefreshingAll(true);
    for (const s of stocksToRefresh) {
      await handleRefreshStock(s.id, s.symbol);
    }
    setIsRefreshingAll(false);
  };

  // Render Loading state while checking key
  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Render API Key Selection Screen if key is missing
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircleIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">API Key Required</h2>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            To use the professional financial data features, you must select an API key from a paid Google Cloud project. 
            <br/><br/>
            Please check the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium hover:text-blue-700">billing documentation</a> for setup instructions.
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Connect API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Portfolio Valuation</h1>
            <p className="text-slate-500 mt-1">Dividend Discount Model (DDM) & Margin of Safety Calculator</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {!isSaved && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium animate-pulse">
                    Unsaved Changes
                </span>
             )}
            <button 
                onClick={handleRefreshAll}
                disabled={isRefreshingAll || stocks.filter(s => s.symbol).length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-lg shadow-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshIcon className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                {isRefreshingAll ? 'Refreshing All...' : 'Refresh All Data'}
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm font-semibold transition-all ${
                    isSaved ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
            >
                {isSaving ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> : <SaveIcon className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Portfolio'}
            </button>
          </div>
        </header>
        <PortfolioSummary settings={settings} onSettingsChange={handleSettingsChange} onSave={handleSave} isSaved={isSaved} />
        <div className="relative">
            <StockTable stocks={stocks} settings={settings} onUpdateStock={handleUpdateStock} onDeleteStock={handleDeleteStock} onAddStock={handleAddStock} onRefreshStock={handleRefreshStock} />
            <div className="mt-4 text-xs text-slate-400 text-right">* Data is retrieved using Google Search grounding via Gemini 3 Pro.</div>
        </div>
      </div>
    </div>
  );
}

export default App;
