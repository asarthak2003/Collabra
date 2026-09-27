import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Mail, Lock, Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import ServerWarmupIndicator from '../components/ServerWarmupIndicator';

function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleName, setRoleName] = useState('ROLE_MEMBER'); // Defaults to Member
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    setIsLoading(true);

    const result = await register(name, username.trim(), email, password, roleName);
    setIsLoading(false);

    if (result.success) {
      navigate('/login'); // Redirect to login page upon success
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
            Create an account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Get started with TeamCollab workspace
          </p>
        </div>

        {/* Automatic Server Cold-Start Warmup Indicator */}
        <ServerWarmupIndicator />

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-center space-x-2 bg-rose-955/40 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-sm mb-6">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                minLength="6"
                className="w-full pl-10 pr-12 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="Minimum 6 characters"
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength="6"
                className="w-full pl-10 pr-12 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Shield size={16} />
              </span>
              <select
                className="w-full pl-10 pr-4 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none cursor-pointer"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={isLoading}
              >
                <option value="ROLE_MEMBER">Workspace Member</option>
                <option value="ROLE_PROJECT_MANAGER">Project Manager</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition rounded-xl font-bold text-sm text-white shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>

        {/* Footer Redirect link */}
        <div className="text-center mt-8 text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;
