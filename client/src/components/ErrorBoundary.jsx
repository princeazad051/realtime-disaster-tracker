import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Unhandled client exception caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 font-sans antialiased">
          {/* Diagnostic Window Card */}
          <div className="w-full max-w-xl bg-slate-900/90 border border-red-500/40 rounded-2xl shadow-2xl shadow-red-950/50 backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-5 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase bg-red-500/15 border border-red-500/30 text-red-400 mb-3">
              Runtime Diagnostic Alert
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
              Application Render Interrupted
            </h1>

            <p className="text-sm text-slate-400 mb-6 max-w-md leading-relaxed">
              The telemetry interface encountered an unexpected runtime exception. An automatic recovery option is available below.
            </p>

            {/* Error Message Monospace Box */}
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-6 text-left overflow-x-auto">
              <p className="text-xs font-mono text-red-300 font-semibold mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown runtime error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] font-mono text-slate-500 max-h-32 overflow-y-auto whitespace-pre-wrap leading-tight mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-all border border-slate-700 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Reset & Clear Cache
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-8 font-mono">
            AegisWatch Telemetry Engine &bull; Error Boundary Protected
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
