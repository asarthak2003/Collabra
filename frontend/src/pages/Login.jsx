import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Layers, User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import ServerWarmupIndicator from "../components/ServerWarmupIndicator";

function Login() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(usernameOrEmail, password);
        setIsLoading(false);
        if (result.success) {
            navigate('/'); // Redirect to the main layout
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900/60 border border-slate-900 p-8 rounded-2xl shadow-2xl backdrop-blur-md">

                {/* Logo and Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-500/20 mb-4">
                        <Layers size={28} />
                    </div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                        Welcome back
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Access your team collaboration workspace
                    </p>
                </div>
                {/* Automatic Server Cold-Start Warmup Indicator */}
                <ServerWarmupIndicator />

                {/* Error Notification Alert */}
                {error && (
                    <div className="flex items-center space-x-2 bg-rose-955/40 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-sm mb-6 animate-shake">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Username or Email
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <User size={16} />
                            </span>
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                placeholder="Enter your username or email"
                                value={usernameOrEmail}
                                onChange={(e) => setUsernameOrEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                                <Lock size={16} />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-10 pr-12 py-3 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition rounded-xl font-bold text-sm text-white shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>
                {/* Footer Redirect link */}
                <div className="text-center mt-8 text-xs text-slate-500">
                    <span>Don't have an account? </span>
                    <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
}
export default Login;