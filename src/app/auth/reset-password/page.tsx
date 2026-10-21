'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/apiClient';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

function ResetPasswordInner() {
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = newPassword.length >= 8;

  async function onRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValid) return;
    setLoading(true);
    try {
      await api.forgotPassword(email);
      showSuccess(t('AUTH.RESET_LINK_SENT'));
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid || !token) return;
    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      showSuccess(t('AUTH.PASSWORD_RESET_SUCCESS'));
      router.push('/auth/login');
    } catch (err) {
      setLoading(false);
      const message = err instanceof ApiError ? err.body?.message : null;
      showError(message || t('COMMON.ERROR'));
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card siipe-card">
        <h2 className="card-title">{token ? t('AUTH.RESET_PASSWORD') : t('AUTH.FORGOT_PASSWORD')}</h2>

        {!token ? (
          <form onSubmit={onRequestReset}>
            <p className="info-text">{t('AUTH.RESET_INFO')}</p>
            <div className="field">
              <label>{t('AUTH.EMAIL')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary full-width mt-2" disabled={!emailValid || loading}>
              {t('AUTH.SEND_RESET_LINK')}
            </button>
          </form>
        ) : (
          <form onSubmit={onResetPassword}>
            <div className="field">
              <label>{t('AUTH.NEW_PASSWORD')}</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary full-width mt-2" disabled={!passwordValid || loading}>
              {t('AUTH.RESET_PASSWORD')}
            </button>
          </form>
        )}

        <div className="back-link mt-2">
          <Link href="/auth/login">
            <Icon name="arrow_back" />
            {t('AUTH.BACK_TO_LOGIN')}
          </Link>
        </div>
      </div>

      <style jsx>{`
        .reset-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
        }
        .reset-card { width: 400px; }
        .card-title { font-size: var(--font-xl); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-4); }
        .info-text { color: var(--color-text-secondary); margin-bottom: 16px; font-size: 14px; }
        .back-link :global(a) {
          display: flex; align-items: center; gap: 4px;
          color: var(--color-primary); text-decoration: none; font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
