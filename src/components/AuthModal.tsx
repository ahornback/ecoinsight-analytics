import React, { useRef, useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { login, loginDemo, register } from '../services/api.ts';
import { useDialogBehavior } from './useDialogBehavior.ts';
import { User } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrganization, setRegOrganization] = useState('');
  const [regRole, setRegRole] = useState<
    'Environmental Consultant' | 'Municipal Sustainability Coordinator' | 'Environmental Data Analyst' | 'Regulatory Compliance Officer'
  >('Environmental Consultant');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(isOpen, onClose, dialogRef);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(loginEmail, loginPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        organization: regOrganization,
        role: regRole
      });
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoPersona = async (
    persona: 'consultant' | 'coordinator' | 'analyst',
    email: string
  ) => {
    setTab('login');
    setLoginEmail(email);
    setLoginPassword('');
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await loginDemo(persona);
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 id="auth-dialog-title" className="font-bold text-base tracking-tight text-white">
                EcoInsight Access Portal
              </h3>
              <p className="text-[11px] text-emerald-400">
                Indiana PM2.5 Regulatory Analytics Platform
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registered Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New User Registration
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5">
          {/* One-click demo sign-in is compiled out of production builds. */}
          {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
            <span className="text-[11px] font-bold text-emerald-900 block mb-1.5 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>One-Click Academic & Audit Evaluation Accounts:</span>
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemoPersona('consultant', 'consultant@apex-enviro.com')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/70 text-slate-800 border border-emerald-300/80 flex items-center justify-between transition-colors"
              >
                <span><strong>Sarah Jenkins</strong> (Enviro Consultant)</span>
                <span className="text-[10px] text-emerald-700 font-mono">Fill & Login</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoPersona('coordinator', 'coordinator@indy.gov')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/70 text-slate-800 border border-emerald-300/80 flex items-center justify-between transition-colors"
              >
                <span><strong>Marcus Vance</strong> (Sustainability Coord)</span>
                <span className="text-[10px] text-emerald-700 font-mono">Fill & Login</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoPersona('analyst', 'analyst@idem-audits.org')}
                className="text-left px-2 py-1 rounded bg-white hover:bg-emerald-100/70 text-slate-800 border border-emerald-300/80 flex items-center justify-between transition-colors"
              >
                <span><strong>Dr. Elena Rostova</strong> (Data Analyst)</span>
                <span className="text-[10px] text-emerald-700 font-mono">Fill & Login</span>
              </button>
            </div>
          </div>
          )}

          {/* Feedback messages */}
          {errorMsg && (
            <div role="alert" className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="consultant@apex-enviro.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to EcoInsight'}
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label htmlFor="register-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Jane Doe, PE"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="jane@consulting.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
                  <input
                    id="register-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="register-organization" className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization
                  </label>
                  <input
                    id="register-organization"
                    type="text"
                    required
                    autoComplete="organization"
                    value={regOrganization}
                    onChange={(e) => setRegOrganization(e.target.value)}
                    placeholder="Organization / Agency"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="register-role" className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Role
                  </label>
                  <select
                    id="register-role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Environmental Consultant">Environmental Consultant</option>
                    <option value="Municipal Sustainability Coordinator">Sustainability Coordinator</option>
                    <option value="Environmental Data Analyst">Environmental Data Analyst</option>
                    <option value="Regulatory Compliance Officer">Compliance Officer</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Complete Secure Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
