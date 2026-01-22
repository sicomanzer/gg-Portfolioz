import React, { useState, useEffect, useCallback } from 'react';
import { Stock, PortfolioSettings } from './types';
import { DEFAULT_GROWTH, DEFAULT_REQ_RETURN, INITIAL_PORTFOLIO_SETTINGS } from './constants';
import PortfolioSummary from './components/PortfolioSummary';
import StockTable from './components/StockTable';
import { fetchStockData } from './services/stockService';
import { SaveIcon, RefreshIcon } from './components/Icons';

function App() {
  const [settings, setSettings] = useState<PortfolioSettings>(INITIAL_PORTFOLIO_SETTINGS);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('portfolio_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.stocks) setStocks(parsed.stocks);
      } catch (e) {
        console.error("Failed to load portfolio", e);
      }
    } else {
        // Initial dummy data for demo purposes
        handleAddStock();
    }
  }, []);

  // Save mechanism
  const handleSave = () => {
    setIsSaving(true);
    const data = { settings, stocks };
    localStorage.setItem('portfolio_data', JSON.stringify(data));
    // Simulate network delay
    setTimeout(() => {
        setIsSaved(true);
        setIsSaving(false);
    }, 500);
  };

  // Mark as unsaved on changes
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
    
    // 1. Validation: Not empty
    if (!trimmedSymbol) {
      handleUpdateStock(id, { error: 'Symbol required' });
      return;
    }
    
    // 2. Validation: Alphabetic characters only
    if (!/^[A-Z]+$/.test(trimmedSymbol)) {
      handleUpdateStock(id, { error: 'A-Z only' });
      return;
    }
    
    // Set loading state and clear existing error
    handleUpdateStock(id, { symbol: trimmedSymbol, loading: true, error: undefined });

    try {
      const data = await fetchStockData(trimmedSymbol);
      handleUpdateStock(id, { ...data, loading: false });
    } catch (error) {
      handleUpdateStock(id, { loading: false, error: 'Fetch failed' });
    }
  };

  const handleRefreshAll = async () => {
    // Filter stocks with valid symbols before starting
    const stocksToRefresh = stocks.filter(s => {
      const sym = s.symbol.trim().toUpperCase();
      return sym !== '' && /^[A-Z]+$/.test(sym);
    });

    if (stocksToRefresh.length === 0) return;

    setIsRefreshingAll(true);
    
    // Run all refreshes in parallel
    await Promise.all(
      stocksToRefresh.map(s => handleRefreshStock(s.id, s.symbol))
    );
    
    setIsRefreshingAll(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header Section */}
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
                    isSaved 
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                }`}
            >
                {isSaving ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <SaveIcon className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Portfolio'}
            </button>
          </div>
        </header>

        {/* Portfolio Settings */}
        <PortfolioSummary 
          settings={settings} 
          onSettingsChange={handleSettingsChange}
          onSave={handleSave}
          isSaved={isSaved}
        />

        {/* Main Table */}
        <div className="relative">
            <StockTable 
            stocks={stocks} 
            settings={settings}
            onUpdateStock={handleUpdateStock}
            onDeleteStock={handleDeleteStock}
            onAddStock={handleAddStock}
            onRefreshStock={handleRefreshStock}
            />
            
            {/* Disclaimer for Demo */}
            <div className="mt-4 text-xs text-slate-400 text-right">
                * Data is retrieved using Google Search grounding for real-time accuracy.
            </div>
        </div>

      </div>
    </div>
  );
}

export default App;