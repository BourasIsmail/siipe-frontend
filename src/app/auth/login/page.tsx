'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { ApiError } from '@/lib/apiClient';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { t } = useI18n();
  const { showError } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const emailRequired = !email;
  const emailInvalid = !emailRequired && !EMAIL_RE.test(email);
  const passwordRequired = !password;
  const formInvalid = emailRequired || emailInvalid || passwordRequired;

  const showEmailError = (touched.email || submitted) && (emailRequired || emailInvalid);
  const showPasswordError = (touched.password || submitted) && passwordRequired;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (formInvalid) return;
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      const message = err instanceof ApiError ? err.body?.message : null;
      showError(message || 'Email ou mot de passe incorrect');
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo">
            <img src="/entraide-logo-mark.png" alt="Entraide Nationale" />
          </div>
          <h1 className="brand-title">Entraide Nationale</h1>
        </div>
        <div className="login-footer-text">
          <p>{t('AUTH.FOOTER_MOTTO')}</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card siipe-card">
          <h2 className="card-title">{t('AUTH.LOGIN')}</h2>

          <form onSubmit={onSubmit}>
            <div className="field">
              <label>{t('AUTH.EMAIL')}</label>
              <div className="input-with-icon">
                <Icon name="email" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  autoComplete="email"
                />
              </div>
              {showEmailError && (
                <span className="err">{emailRequired ? t('AUTH.EMAIL_REQUIRED') : t('AUTH.EMAIL_INVALID')}</span>
              )}
            </div>

            <div className="field mt-2">
              <label>{t('AUTH.PASSWORD')}</label>
              <div className="input-with-icon">
                <Icon name="lock" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  autoComplete="current-password"
                />
                <button type="button" className="toggle-visibility" onClick={() => setShowPassword(s => !s)}>
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
              {showPasswordError && <span className="err">{t('AUTH.PASSWORD_REQUIRED')}</span>}
            </div>

            <div className="forgot-link">
              <Link href="/auth/reset-password">{t('AUTH.FORGOT_PASSWORD')}</Link>
            </div>

            <button type="submit" className="btn btn-primary full-width login-btn mt-2" disabled={loading}>
              {loading ? <span className="spinner small" /> : <span>{t('AUTH.SIGN_IN')}</span>}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
        }

        .login-left {
          flex: 1;
          position: relative;
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: white;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0, transparent 40%),
                             radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0, transparent 45%);
          pointer-events: none;
        }

        .login-brand { text-align: center; position: relative; z-index: 1; }
        .brand-logo {
          width: 96px; height: 96px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
          padding: 10px;
        }
        .brand-logo img { width: 100%; height: 100%; object-fit: contain; }
        .brand-title {
          margin-top: 20px;
          font-size: var(--font-xl);
          font-weight: 800;
          color: white;
          letter-spacing: -0.01em;
        }

        .login-footer-text { position: absolute; bottom: 24px; z-index: 1; }
        .login-footer-text p { font-size: var(--font-xs); opacity: 0.65; letter-spacing: 0.2px; }

        .login-right {
          width: 440px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          background: var(--color-bg);
        }

        .login-card {
          width: 100%;
          border-radius: var(--radius-xl) !important;
          box-shadow: var(--shadow-lg) !important;
        }
        .card-title { font-size: var(--font-xl); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-6); }

        .input-with-icon {
          display: flex; align-items: center; gap: 8px;
          border: 1px solid var(--color-border); border-radius: var(--radius-sm);
          padding: 0 12px; height: 44px;
        }
        .input-with-icon :global(.material-icons) { color: var(--color-text-tertiary); font-size: 20px; }
        .input-with-icon input {
          border: none; outline: none; flex: 1; height: 100%;
          font-size: var(--font-base); font-family: inherit; background: none;
        }
        .toggle-visibility { background: none; border: none; cursor: pointer; display: flex; padding: 4px; }

        .err { color: var(--color-danger); font-size: var(--font-xs); margin-top: 2px; display: block; }

        .forgot-link { text-align: end; margin-top: var(--space-1); }
        .forgot-link :global(a) { color: var(--color-primary); font-size: var(--font-sm); font-weight: 500; text-decoration: none; }
        .forgot-link :global(a:hover) { text-decoration: underline; }

        .login-btn {
          height: 48px;
          font-size: var(--font-md);
          width: 100%;
          justify-content: center;
        }
        .spinner.small { width: 20px; height: 20px; border-width: 2px; border-color: rgba(255,255,255,0.4); border-top-color: white; }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; }
        }
      `}</style>
    </div>
  );
}
