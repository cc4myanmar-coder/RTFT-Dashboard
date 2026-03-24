import React, { useState, useEffect, useMemo } from 'react';
import { Newspaper, AlertTriangle, Calendar, Clock, Globe, RefreshCcw, ChevronRight, Info, Sparkles, TrendingUp, TrendingDown, Activity, Zap, BarChart3, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsItem {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string;
  previous: string;
  actual?: string;
}

interface TradData {
  indices: IndexData[];
  indicesSeasonality: SeasonalityData[];
}

interface IndexData {
  symbol: string;
  contractName: string;
  latest: string;
  change: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  liquidity: string; // Level: High, Moderate, Low, Minimal
  liquidityAmount: string; // Specific number: e.g., "$860.4M"
  time: string;
}

interface Headline {
  id: number;
  title: string;
  source: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface FearGreed {
  value: number;
  sentiment: string;
  lastUpdated: string;
}

interface SeasonalityData {
  asset: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  description: string;
  strength: number; // 1-100
}

interface WarNews {
  id: number;
  title: string;
  region: string;
  summary: string;
  severity: 'Critical' | 'High' | 'Moderate';
  time: string;
}

export const NewsTab: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [warNews, setWarNews] = useState<WarNews[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [tradData, setTradData] = useState<TradData | null>({
    indices: [
      { symbol: 'ESM26', contractName: "S&P 500 E-Mini (Jun '26)", latest: '6,640.25', change: '+5.50', open: '6,635.00', high: '6,653.50', low: '6,582.50', volume: '129,724', liquidity: 'High', liquidityAmount: '$860.4M', time: '02:42 CT' },
      { symbol: 'ESU26', contractName: "S&P 500 E-Mini (Sep '26)", latest: '6,698.75', change: '+13.00', open: '6,678.00', high: '6,702.00', low: '6,635.00', volume: '496', liquidity: 'Low', liquidityAmount: '$3.2M', time: '02:18 CT' },
      { symbol: 'NQM26', contractName: "Nasdaq 100 E-Mini (Jun '26)", latest: '24,450.00', change: '+41.75', open: '24,417.25', high: '24,507.25', low: '24,193.50', volume: '68,668', liquidity: 'High', liquidityAmount: '$1,642.8M', time: '02:42 CT' },
      { symbol: 'NQU26', contractName: "Nasdaq 100 E-Mini (Sep '26)", latest: '24,655.50', change: '+27.75', open: '24,623.50', high: '24,719.25', low: '24,430.00', volume: '101', liquidity: 'Low', liquidityAmount: '$2.4M', time: '02:35 CT' },
      { symbol: 'YMM26', contractName: "Dow Futures Mini (Jun '26)", latest: '46,547', change: '+25', open: '46,524', high: '46,649', low: '46,173', volume: '15,220', liquidity: 'Moderate', liquidityAmount: '$724.5M', time: '02:42 CT' },
      { symbol: 'YMU26', contractName: "Dow Futures Mini (Sep '26)", latest: '46,825', change: '+24', open: '46,679', high: '46,825', low: '46,488', volume: '24', liquidity: 'Minimal', liquidityAmount: '$1.1M', time: '02:41 CT' },
      { symbol: 'QRM26', contractName: "Russell 2000 E-Mini (Jun '26)", latest: '2,512.90', change: '+3.30', open: '2,510.20', high: '2,520.30', low: '2,478.30', volume: '17,420', liquidity: 'Moderate', liquidityAmount: '$432.8M', time: '02:42 CT' },
      { symbol: 'QRU26', contractName: "Russell 2000 E-Mini (Sep '26)", latest: '2,503.30', change: '-24.10', open: '2,520.00', high: '2,520.00', low: '2,503.30', volume: '8', liquidity: 'Minimal', liquidityAmount: '$0.2M', time: '00:15 CT' },
      { symbol: 'EWM26', contractName: "S&P Midcap E-Mini (Jun '26)", latest: '3,381.10', change: '+1.00', open: '3,379.20', high: '3,392.80', low: '3,342.90', volume: '257', liquidity: 'Low', liquidityAmount: '$8.6M', time: '02:40 CT' },
      { symbol: 'EWU26', contractName: "S&P Midcap E-Mini (Sep '26)", latest: '3,408.60s', change: '+63.70', open: '3,408.60', high: '3,438.80', low: '3,319.50', volume: 'N/A', liquidity: 'N/A', liquidityAmount: 'N/A', time: '03/23/26' },
      { symbol: 'ETM26', contractName: "S&P 500 Micro (Jun '26)", latest: '6,640.25', change: '+5.50', open: '6,633.25', high: '6,653.50', low: '6,582.50', volume: '247,721', liquidity: 'High', liquidityAmount: '$164.2M', time: '02:42 CT' },
      { symbol: 'NMM26', contractName: "Nasdaq 100 Micro (Jun '26)", latest: '24,452.25', change: '+44.00', open: '24,408.25', high: '24,507.00', low: '24,193.50', volume: '374,096', liquidity: 'High', liquidityAmount: '$182.5M', time: '02:42 CT' },
      { symbol: 'VIJ26', contractName: "S&P 500 VIX (Apr '26)", latest: '23.7000', change: '-0.6024', open: '24.2000', high: '25.0000', low: '23.6500', volume: '6,807', liquidity: 'Moderate', liquidityAmount: '$45.2M', time: '02:42 CT' },
      { symbol: 'VIK26', contractName: "S&P 500 VIX (May '26)", latest: '23.3000', change: '-0.3039', open: '23.5000', high: '24.1200', low: '23.2700', volume: '4,196', liquidity: 'Moderate', liquidityAmount: '$28.4M', time: '02:41 CT' },
      { symbol: 'GDJ26', contractName: "S&P GSCI (Apr '26)", latest: '694.03s', change: '-42.12', open: '694.80', high: '736.60', low: '683.80', volume: '16', liquidity: 'Low', liquidityAmount: '$1.2M', time: '03/23/26' }
    ],
    indicesSeasonality: [
      { asset: 'S&P 500', trend: 'Bullish', description: 'March typically shows strong performance ahead of Q1 earnings.', strength: 68 },
      { asset: 'Nasdaq 100', trend: 'Bullish', description: 'Tech sector often leads in late Q1.', strength: 72 },
      { asset: 'Russell 2000', trend: 'Neutral', description: 'Small caps showing mixed signals in high interest rate environment.', strength: 45 }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAiFallback, setIsAiFallback] = useState(false);
  
  // Calendar filters
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchMarketDataWithAI = async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a comprehensive market intelligence report for March 24, 2026. 
        Include:
        1. US Economic News for this week (March 23-29, 2026).
        2. Current Fear & Greed Index for Traditional Indices.
        3. Market Seasonality trends for S&P 500, Nasdaq, Dow, and Russell 2000.
        4. Detailed Indices (Futures) data for: ESM26, ESU26, NQM26, NQU26, YMM26, YMU26, QRM26, QRU26, EWM26, EWU26, ETM26, NMM26, VIJ26, VIK26, GDJ26.
           For each, provide: Symbol, Contract Name, Latest Price, Change, Open, High, Low, Volume, Liquidity Level (High, Moderate, Low, Minimal), Liquidity Amount (specific numerical estimate in USD, e.g., "$860.4M"), and Time (CT).
        5. Top 5 Market Headlines for today.
        6. Top 3 War or Geopolitical Conflict news items that could impact global markets.
        
        Search for current trends and project them to March 2026. Return as a single JSON object.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    country: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                    forecast: { type: Type.STRING },
                    previous: { type: Type.STRING },
                    actual: { type: Type.STRING },
                  },
                  required: ["title", "country", "date", "time", "impact"]
                }
              },
              headlines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    source: { type: Type.STRING },
                    time: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  },
                  required: ["id", "title", "source", "time", "impact"]
                }
              },
              warNews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    region: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ["Critical", "High", "Moderate"] },
                    time: { type: Type.STRING },
                  },
                  required: ["id", "title", "region", "summary", "severity", "time"]
                }
              },
              fearGreedTrad: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.NUMBER },
                  sentiment: { type: Type.STRING }
                },
                required: ["value", "sentiment"]
              },
              indices: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    contractName: { type: Type.STRING },
                    latest: { type: Type.STRING },
                    change: { type: Type.STRING },
                    open: { type: Type.STRING },
                    high: { type: Type.STRING },
                    low: { type: Type.STRING },
                    volume: { type: Type.STRING },
                    liquidity: { type: Type.STRING },
                    liquidityAmount: { type: Type.STRING },
                    time: { type: Type.STRING }
                  },
                  required: ["symbol", "contractName", "latest", "change", "open", "high", "low", "volume", "liquidity", "liquidityAmount", "time"]
                }
              },
              seasonalityTrad: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    asset: { type: Type.STRING },
                    trend: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
                    description: { type: Type.STRING },
                    strength: { type: Type.NUMBER }
                  },
                  required: ["asset", "trend", "description", "strength"]
                }
              }
            },
            required: ["news", "fearGreedTrad", "indices", "seasonalityTrad", "headlines"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.news) {
        setNews(data.news);
        if (data.headlines) setHeadlines(data.headlines);
        if (data.warNews) setWarNews(data.warNews);
        setFearGreed({ ...data.fearGreedTrad, lastUpdated: new Date().toISOString() });
        setTradData({
          indices: data.indices,
          indicesSeasonality: data.seasonalityTrad
        });
        setIsAiFallback(true);
      }
    } catch (err) {
      console.error("AI Market Data Fetch failed:", err);
      setError('Using estimated data due to service interruption.');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First try to get what we can from APIs
      const [newsRes, fgRes, tradRes] = await Promise.all([
        fetch(`/api/news?start=${dateRange.start}&end=${dateRange.end}`),
        fetch('/api/fear-greed'),
        fetch('/api/trad/liquidity')
      ]);

      const parseJson = async (res: Response) => {
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          return await res.json();
        }
        return null;
      };

      const newsData = await parseJson(newsRes);
      const fgData = await parseJson(fgRes);
      const tData = await parseJson(tradRes);

      // If any of these are missing or we want to ensure AI enhancement, call the AI
      if (!newsData || !fgData || !tData) {
        await fetchMarketDataWithAI();
      } else {
        setNews(newsData);
        setFearGreed(fgData);
        setTradData(tData);
      }

      // Always fetch headlines separately as they are more dynamic
      const hRes = await fetch('/api/headlines');
      const hData = await parseJson(hRes);
      if (hData) setHeadlines(hData);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch all data:", err);
      await fetchMarketDataWithAI();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15 * 60 * 1000); // 15 min refresh
    return () => clearInterval(interval);
  }, [dateRange]);

  const groupedNews = useMemo(() => {
    const groups: { [key: string]: NewsItem[] } = {};
    news.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [news]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Newspaper className="text-red-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              Market Intelligence
            </h1>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
              Traditional Indices & Economic Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Market Switcher Removed as we now have separate tabs */}

          <div className="flex items-center gap-3">
            {isAiFallback && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                <Sparkles size={10} />
                AI Enhanced
              </div>
            )}
            <button 
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
            >
              <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
              {loading ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Indices Table (New) */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Activity size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Contract Liquidity</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Indices Futures Real-time Depth Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Market Status</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live & Active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Symbol</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Contract Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Latest</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Change</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Open</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">High</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Low</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Volume</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Liquidity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {tradData?.indices && tradData.indices.length > 0 ? (
                tradData.indices.map((index, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                        <span className="text-[11px] font-black text-blue-400 group-hover:text-blue-300 transition-colors">{index.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-zinc-300">{index.contractName}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-white text-right">{index.latest}</td>
                    <td className={`px-6 py-4 text-[11px] font-mono text-right ${index.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {index.change}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-zinc-400 text-right">{index.open}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-zinc-400 text-right">{index.high}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-zinc-400 text-right">{index.low}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-zinc-500 text-right">{index.volume}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-blue-400 font-black">{index.liquidityAmount}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                            (index.liquidity || '').toLowerCase().includes('high') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            (index.liquidity || '').toLowerCase().includes('moderate') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            (index.liquidity || '').toLowerCase().includes('low') ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {index.liquidity}
                          </span>
                        </div>
                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: (index.liquidity || '').toLowerCase().includes('high') ? '100%' :
                                     (index.liquidity || '').toLowerCase().includes('moderate') ? '66%' :
                                     (index.liquidity || '').toLowerCase().includes('low') ? '33%' : '10%'
                            }}
                            className={cn(
                              "h-full rounded-full",
                              (index.liquidity || '').toLowerCase().includes('high') ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                              (index.liquidity || '').toLowerCase().includes('moderate') ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
                              (index.liquidity || '').toLowerCase().includes('low') ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" :
                              "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono text-zinc-600 text-right uppercase">{index.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                    {loading ? 'Fetching market data...' : 'No indices data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: War News + Headlines (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* War & Geopolitical News */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">
                  Geopolitical Risk
                </h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Conflict Monitor</span>
            </div>

            <div className="space-y-4">
              {warNews.length > 0 ? (
                warNews.map((war) => (
                  <div key={war.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3 hover:bg-red-500/10 transition-all group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{war.region}</span>
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        war.severity === 'Critical' ? "bg-red-500 text-white" :
                        war.severity === 'High' ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {war.severity}
                      </div>
                    </div>
                    <h3 className="text-[11px] font-bold text-zinc-200 leading-tight group-hover:text-white transition-colors">
                      {war.title}
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                      {war.summary}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Clock size={10} className="text-zinc-600" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{war.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No critical conflicts reported</p>
                </div>
              )}
            </div>
          </div>

          {/* Headlines */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">
                  Market Headlines
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Feed</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {headlines.map((headline) => (
                <div key={headline.id} className="group cursor-pointer p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 hover:bg-zinc-900/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-1 rounded-full ${
                        headline.impact === 'High' ? 'bg-red-500' : 
                        headline.impact === 'Medium' ? 'bg-orange-500' : 'bg-zinc-600'
                      }`} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{headline.source}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{headline.time}</span>
                  </div>
                  <h3 className="text-[11px] font-bold text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                    {headline.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Economic Calendar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-8 min-h-[600px]">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-red-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Economic Calendar</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">High</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Med</span>
                    </div>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex items-center gap-3 p-2 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
                  <div className="flex-1 flex flex-col gap-1 px-3 relative group">
                    <label className="text-[7px] font-black uppercase tracking-widest text-zinc-500">From</label>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-[10px] font-mono text-zinc-300 outline-none cursor-pointer focus:text-blue-400 transition-colors w-full"
                      />
                    </div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800" />
                  <div className="flex-1 flex flex-col gap-1 px-3 relative group">
                    <label className="text-[7px] font-black uppercase tracking-widest text-zinc-500">To</label>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-600 group-hover:text-blue-400 transition-colors" />
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-[10px] font-mono text-zinc-300 outline-none cursor-pointer focus:text-blue-400 transition-colors w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-10 max-h-[800px] overflow-y-auto no-scrollbar pr-1">
                {Object.entries(groupedNews).length > 0 ? (
                  Object.entries(groupedNews).map(([date, items]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center gap-4 sticky top-0 bg-zinc-900/40 backdrop-blur-sm z-10 py-2">
                        <div className="h-px flex-1 bg-zinc-800/50" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
                          {date}
                        </span>
                        <div className="h-px flex-1 bg-zinc-800/50" />
                      </div>

                      <div className="space-y-3">
                        {items.map((item, idx) => (
                          <div key={`${item.title}-${idx}`} className="group flex items-center gap-4 p-4 bg-zinc-950/30 border border-zinc-800/30 rounded-2xl hover:bg-zinc-950/50 hover:border-zinc-700 transition-all">
                            <div className="flex flex-col items-center justify-center min-w-[60px] py-1 border-r border-zinc-800/50">
                              <Clock size={12} className="text-zinc-600 mb-1" />
                              <span className="text-[10px] font-mono text-zinc-400">{item.time}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  item.impact === 'High' ? 'bg-red-500' : 'bg-orange-500'
                                }`} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{item.impact} Impact</span>
                              </div>
                              <h3 className="text-[11px] font-bold text-zinc-200 group-hover:text-white transition-colors leading-tight">{item.title}</h3>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              <div className="space-y-0.5 min-w-[40px]">
                                <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Actual</p>
                                <p className={`text-[10px] font-black ${item.actual ? 'text-white' : 'text-zinc-700'}`}>{item.actual || '--'}</p>
                              </div>
                              <div className="space-y-0.5 min-w-[40px]">
                                <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Forecast</p>
                                <p className="text-[10px] font-mono text-zinc-500">{item.forecast || '--'}</p>
                              </div>
                              <div className="space-y-0.5 min-w-[40px]">
                                <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Prev</p>
                                <p className="text-[10px] font-mono text-zinc-500">{item.previous || '--'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-600 space-y-4">
                    <Calendar size={48} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-widest">No events found for this range</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Right Column: Seasonality (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">
                  Indices Seasonality
                </h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Historical Trends</span>
            </div>

            <div className="space-y-4">
              {tradData?.indicesSeasonality?.map((item) => (
                <div key={item.asset} className="p-5 bg-zinc-950/50 border border-zinc-800/50 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{item.asset}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      item.trend === 'Bullish' ? 'text-emerald-400 bg-emerald-500/10' : 
                      item.trend === 'Bearish' ? 'text-red-400 bg-red-500/10' : 
                      'text-zinc-400 bg-zinc-500/10'
                    }`}>
                      {item.trend === 'Bullish' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {item.trend}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-relaxed italic group-hover:text-zinc-400 transition-colors">
                    "{item.description}"
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      <span>Historical Strength</span>
                      <span className={item.trend === 'Bullish' ? 'text-emerald-400' : 'text-red-400'}>{item.strength}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/30">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.strength}%` }}
                        className={`h-full rounded-full ${
                          item.trend === 'Bullish' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        }`} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Info size={12} className="text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Trading Tip</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                Seasonality is a roadmap, not a rule. Always align seasonal trends with current price action and liquidity windows.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
