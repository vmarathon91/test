import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    setSaveSuccess(true);
    onConfigSaved();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseConfig('', '');
    onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-athletic text-2xl font-black uppercase text-white tracking-wide">
              Kết Nối Cơ Sở Dữ Liệu Supabase
            </h2>
            <p className="text-xs text-slate-400">
              Cấu hình bảng <code className="text-orange-400">teams</code>,{' '}
              <code className="text-orange-400">team_members</code> và{' '}
              <code className="text-orange-400">marathon_registrations</code>
            </p>
          </div>
        </div>

        {/* Current status banner */}
        <div
          className={`p-3.5 rounded-xl border mb-6 flex items-center justify-between text-xs ${
            currentConfig.isConfigured
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                currentConfig.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium">
              {currentConfig.isConfigured
                ? 'Đã cấu hình Supabase Cloud (Live Sync)'
                : 'Đang chạy Local Hybrid DB (Sẵn sàng kết nối Supabase Cloud)'}
            </span>
          </div>
          <span className="text-[11px] opacity-80">
            {currentConfig.isConfigured ? 'Direct API' : 'Tự động fallback mượt mà'}
          </span>
        </div>

        {/* Form to enter credentials */}
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUrl(DEFAULT_SUPABASE_URL);
                  setAnonKey(DEFAULT_SUPABASE_ANON_KEY);
                  saveSupabaseConfig(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
                  onConfigSaved();
                }}
                className="px-2.5 py-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors border border-orange-500/20 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Dùng API dự án</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                Xóa cấu hình (Local DB)
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all shadow-md shadow-orange-600/20 flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Đã lưu kết nối!
                </>
              ) : (
                'Lưu kết nối Supabase'
              )}
            </button>
          </div>
        </form>

        {/* SQL Script Generator Box */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="font-athletic text-sm font-bold uppercase text-slate-200">
                SQL Tạo 2 Bảng: teams & team_members
              </span>
            </div>
            <button
              onClick={handleCopySQL}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sao chép SQL</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Chỉ cần mở{' '}
            <strong className="text-slate-200">Supabase Dashboard &gt; SQL Editor</strong>, dán mã SQL
            này và bấm <strong>Run</strong> để tạo chuẩn 100% schema và chính sách RLS.
          </p>

          <pre className="p-3 rounded-lg bg-[#070A11] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 leading-relaxed">
            {SUPABASE_SQL_SCHEMA.slice(0, 480)}...
          </pre>
        </div>
      </div>
    </div>
  );
};
