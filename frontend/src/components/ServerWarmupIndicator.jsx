import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, CloudLightning } from 'lucide-react';

const ESTIMATED_BOOT_SECONDS = 50;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function ServerWarmupIndicator() {
  const [status, setStatus] = useState('hidden'); // 'hidden' | 'waking' | 'ready'
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(5);
  
  const isMounted = useRef(true);
  const stateRef = useRef('checking'); // 'checking' | 'waking' | 'ready' | 'hidden'
  const initialDelayRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    stateRef.current = 'checking';
    let startTime = null;

    const clearAllTimers = () => {
      clearTimeout(initialDelayRef.current);
      clearInterval(pingIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };

    const startWakingMode = () => {
      // If already ready or already waking, do nothing
      if (stateRef.current === 'ready' || stateRef.current === 'waking' || !isMounted.current) {
        return;
      }
      
      stateRef.current = 'waking';
      setStatus('waking');
      startTime = Date.now();

      // Start elapsed timer & progress calculation
      timerIntervalRef.current = setInterval(() => {
        if (!isMounted.current || stateRef.current !== 'waking' || !startTime) return;
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(currentElapsed);

        const calculatedProgress = Math.min(
          95,
          Math.max(5, Math.round((currentElapsed / ESTIMATED_BOOT_SECONDS) * 100))
        );
        setProgress(calculatedProgress);
      }, 1000);
    };

    // Health check function
    const checkServer = async () => {
      // If already marked ready, stop checking
      if (stateRef.current === 'ready') return true;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 4000 });
        if (res.data?.status === 'UP') {
          if (!isMounted.current || stateRef.current === 'ready') return true;

          // Clear all pending timeouts and polling intervals
          clearAllTimers();
          stateRef.current = 'ready';
          setProgress(100);
          setStatus('ready');

          // Auto-hide the green ready banner after 3 seconds
          setTimeout(() => {
            if (isMounted.current) {
              stateRef.current = 'hidden';
              setStatus('hidden');
            }
          }, 3000);
          return true;
        }
      } catch (err) {
        // Only trigger waking mode if we are not already ready
        if (stateRef.current !== 'ready') {
          startWakingMode();
        }
      }
      return false;
    };

    // Immediate initial check
    checkServer();

    // If initial check doesn't succeed within 1.5 seconds, start waking countdown
    initialDelayRef.current = setTimeout(() => {
      if (stateRef.current === 'checking') {
        startWakingMode();
      }
    }, 1500);

    // Continue polling every 3 seconds
    pingIntervalRef.current = setInterval(() => {
      checkServer();
    }, 3000);

    return () => {
      isMounted.current = false;
      clearAllTimers();
    };
  }, []);

  if (status === 'hidden') {
    return null;
  }

  const remainingSeconds = Math.max(0, ESTIMATED_BOOT_SECONDS - elapsed);

  return (
    <div
      style={{
        backgroundColor: status === 'ready' ? '#ecfdf5' : '#eef2ff',
        borderColor: status === 'ready' ? '#a7f3d0' : '#c7d2fe',
      }}
      className="mb-5 rounded-xl border p-3.5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {status === 'ready' ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          ) : (
            <CloudLightning size={20} className="text-indigo-600 shrink-0 animate-pulse" />
          )}

          <div className="flex flex-col">
            <span
              style={{ color: status === 'ready' ? '#065f46' : '#1e1b4b' }}
              className="text-xs font-bold leading-tight"
            >
              {status === 'ready'
                ? 'Server is online & ready!'
                : 'Waking up cloud server...'}
            </span>
            <span
              style={{ color: status === 'ready' ? '#047857' : '#4338ca' }}
              className="text-[11px] font-semibold mt-0.5"
            >
              {status === 'ready'
                ? 'Ready to sign in immediately'
                : 'Free-tier cold start in progress'}
            </span>
          </div>
        </div>

        {status === 'waking' && (
          <div
            style={{
              color: '#312e81',
              backgroundColor: '#e0e7ff',
              borderColor: '#a5b4fc',
            }}
            className="flex items-center space-x-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-xs"
          >
            <Loader2 size={12} className="animate-spin text-indigo-600" />
            <span>~{remainingSeconds > 0 ? `${remainingSeconds}s` : 'soon'}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {status === 'waking' && (
        <div
          style={{ backgroundColor: '#c7d2fe' }}
          className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
        >
          <div
            style={{ width: `${progress}%`, backgroundColor: '#4f46e5' }}
            className="h-full rounded-full transition-all duration-1000 ease-out"
          ></div>
        </div>
      )}
    </div>
  );
}

export default ServerWarmupIndicator;
