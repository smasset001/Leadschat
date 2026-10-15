import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { login, signup, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpNotAllowed, setIsOpNotAllowed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsOpNotAllowed(false);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('auth/popup-closed-by-user')) {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsOpNotAllowed(false);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        onSuccess?.();
        onClose();
      } else if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('Full name is required.');
        if (!mobileNumber.trim() || mobileNumber.replace(/[^0-9]/g, '').length < 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        await signup(fullName.trim(), mobileNumber.trim(), email.trim(), password);
        onSuccess?.();
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('Please enter your account email.');
        await resetPassword(email.trim());
        setSuccessMessage('Password reset link sent to your email inbox.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/operation-not-allowed')) {
        setIsOpNotAllowed(true);
        setError('Email/Password provider is not enabled in Firebase Console. Please click "Continue with Google" above to sign in instantly, or enable Email/Password under Firebase Console Authentication settings.');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('This email address is already in use by another account.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white p-6 sm:p-8 shadow-2xl border border-[#26282f] light:border-slate-200 text-white light:text-slate-900 max-h-[90vh] overflow-y-auto neu-dark-flat light:neu-light-flat transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white light:hover:text-slate-600 rounded-full hover:bg-white/5 light:hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] flex items-center justify-center text-white font-black text-xs neu-coral-glow shadow-md">
              LC
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#ff4545]">
              Leads Chat
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your Leads Chat account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-500 mt-1">
            {mode === 'login' && 'Access customer messages, affiliate links, and Lead Bank.'}
            {mode === 'signup' && 'Business messaging and customer acquisition for sales affiliates.'}
            {mode === 'forgot' && "Enter your email and we'll send a password recovery link."}
          </p>
        </div>

        {/* Instant Google Sign-In */}
        {mode !== 'forgot' && (
          <div className="space-y-4 mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-2xl border border-white/10 light:border-slate-300 bg-[#24262d] dark:bg-[#24262d] light:bg-white hover:bg-[#2a2c35] light:hover:bg-slate-50 text-white light:text-slate-800 font-semibold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#26282f] light:border-slate-200 w-full" />
              <span className="bg-[#1c1d22] dark:bg-[#1c1d22] light:bg-white px-3 text-[10px] uppercase tracking-wider text-slate-500 light:text-slate-400 font-bold absolute">
                or with email
              </span>
            </div>
          </div>
        )}

        {/* Operation not allowed banner with direct guide */}
        {isOpNotAllowed && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Firebase Email/Password Setup Required</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-200/90">
              Firebase enables Google Login by default. To use Email & Password:
              <br />
              1. Click the button above to <strong>Continue with Google</strong> right now.
              <br />
              2. Or enable <strong>Email/Password</strong> in{' '}
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0560705724/authentication/providers"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-amber-400"
              >
                Firebase Console &rarr;
              </a>
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && !isOpNotAllowed && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Shalom Massey"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#edf0f6] text-white light:text-slate-900 border border-white/5 light:border-slate-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#ff4545]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700">
                    Mobile Number
                  </label>
                  <span className="text-[10px] text-slate-500">Account identifier</span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="8882432110"
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#edf0f6] text-white light:text-slate-900 border border-white/5 light:border-slate-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#ff4545]"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                  Note: Stored securely for account uniqueness without SMS verification.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#edf0f6] text-white light:text-slate-900 border border-white/5 light:border-slate-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#ff4545]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-[#ff4545] hover:opacity-80 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-[#141518] dark:bg-[#141518] light:bg-[#edf0f6] text-white light:text-slate-900 border border-white/5 light:border-slate-300 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#ff4545]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-tr from-[#ff3e3e] to-[#ff5c5c] text-white font-bold text-sm shadow-lg neu-coral-glow hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode switch footer */}
        <div className="mt-6 pt-4 border-t border-white/10 light:border-slate-200 text-center text-xs text-slate-400 light:text-slate-600">
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="font-bold text-[#ff4545] hover:opacity-80 cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-[#ff4545] hover:opacity-80 cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="font-semibold text-slate-300 light:text-slate-600 hover:text-white cursor-pointer"
            >
              Back to Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

