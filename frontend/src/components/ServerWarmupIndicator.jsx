import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Server, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const ESTIMATED_BOOT_SECONDS = 60;

function ServerWarmupIndicator() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'waking' | 'ready' | 'hidden'
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const isMounted = useRef(true);
  const pingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    let startTime = Date.now();

    // Check health immediately
    const checkServer = async () => {
      try {
        const res = await api.get('/api/health', { timeout: 8000 });
        if (res.data?.status === 'UP') {
          if (!isMounted.current) return;
          clearInterval(pingIntervalRef.current);
          clearInterval(timerIntervalRef.current);
          setProgress(100);
          setStatus('ready');
          
          // Auto-hide after 3.5 seconds
          setTimeout(() => {
            if (isMounted.current) {
              setStatus('hidden');
            }
          }, 3500);
          return true;
        }
      } catch (err) {
        // Backend still asleep or booting up
        if (isMounted.current && status === 'checking') {
          setStatus('waking');
        }
      }
      return false;
    };

    // If still checking after 2.5s, trigger waking state
    const slowCheckTimeout = setTimeout(() => {
      if (isMounted.current && status === 'checking') {
        setStatus('waking');
      }
    }, 2500);

    // Initial check
    checkServer();

    // Periodic ping every 4.5 seconds
    pingIntervalRef.current = setInterval(() => {
      checkServer();
    }, 4500);

    // Dynamic timer & progress simulation
    timerIntervalRef.current = setInterval(() => {
      if (!isMounted.current) return;
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(currentElapsed);

      // Smooth progress calculation (caps at 95% until real 200 response received)
      const calculatedProgress = Math.min(
        95,
        Math.round((currentElapsed / ESTIMATED_BOOT_SECONDS) * 100)
      );
      setProgress(calculatedProgress);
    }, 1000);

    return () => {
      isMounted.current = false;
      clearTimeout(slowCheckTimeout);
      clearInterval(pingIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, []);

  if (status === 'hidden' || status === 'checking') {
    return null;
  }

  const remainingSeconds = Math.max(0, ESTIMATED_BOOT_SECONDS - elapsed);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl text-white ${
            status === 'ready' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 animate-pulse'
          }`}>
            {status === 'ready' ? (
              <CheckCircle2 size={18} />
            ) : (
              <Server size={18} />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>{status === 'ready' ? 'Cloud Server Ready' : 'Waking Up Cloud Backend'}</span>
              {status === 'ready' && <Sparkles size={12} className="text-amber-400" />}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {status === 'ready' 
                ? 'Backend connected. You can now sign in instantly!' 
                : 'Free-tier instance is cold-starting. Ping sent to Render...'}
            </p>
          </div>
        </div>

        {status === 'waking' && (
          <div className="flex items-center space-x-1 text-[11px] font-mono text-indigo-400 font-semibold shrink-0 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-lg">
            <Loader2 size={11} className="animate-spin text-indigo-400" />
            <span>~{remainingSeconds > 0 ? `${remainingSeconds}s` : 'a few sec'}</span>
          </div>
        )}
      </div>

      {/* Dynamic Animated Progress Bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
          <span>{status === 'ready' ? '100% Ready' : `Spinning up container: ${progress}%`}</span>
          <span>{status === 'ready' ? 'Online' : `${elapsed}s elapsed`}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              status === 'ready' 
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' 
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 shadow-md shadow-indigo-500/30'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default ServerWarmupIndicator;
