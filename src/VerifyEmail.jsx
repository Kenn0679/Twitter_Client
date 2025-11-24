import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail, Clock, Shield } from 'lucide-react';
import api from './api';
// StatusIcon component cho trạng thái xác thực
function StatusIcon({ status }) {
  if (status === 'loading') return <Loader2 className='verify-icon' style={{ color: '#3b82f6' }} />;
  if (status === 'success') return <CheckCircle className='verify-icon' style={{ color: '#10b981' }} />;
  if (status === 'expired') return <Clock className='verify-icon' style={{ color: '#f59e0b' }} />;
  if (status === 'error') return <XCircle className='verify-icon' style={{ color: '#ef4444' }} />;
  if (status === 'resent') return <Mail className='verify-icon' style={{ color: '#60a5fa' }} />;
  return null;
}

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const emailParam = urlParams.get('email');
    if (emailParam) setEmail(emailParam);
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }
    verifyEmail(token);
  }, []);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (status === 'success' && countdown === 0) {
      window.location.href = '/';
    }
  }, [status, countdown]);

  const verifyEmail = async (token) => {
    try {
      const response = await api.post('/users/verify-email', {
        email_verify_token: token
      });
      setStatus('success');
      setMessage(response.data.message || 'Your email has been successfully verified!');
    } catch (error) {
      if (error.response && (error.response.status === 410 || error.response.data?.message?.includes('expired'))) {
        setStatus('expired');
        setMessage(error.response.data.message || 'This verification link has expired. Please request a new one.');
      } else {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. Please try again.');
      }
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please try logging in again.');
      return;
    }
    setIsResending(true);
    setStatus('loading');
    setMessage('Sending new verification email...');
    try {
      const response = await fetch('http://localhost:5000/resend-verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setStatus('resent');
        setMessage(data.message || 'A new verification email has been sent! Check your inbox.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to resend verification email. Please check your connection and try again.');
    }
  };

  return (
    <div className='verify-bg'>
      <div className='verify-grid'></div>
      <div className='verify-container'>
        <a href='/' className='verify-back'>
          <ArrowLeft style={{ width: 20, height: 20, marginRight: 8 }} />
          Back to Home
        </a>
        <div className='verify-card'>
          {status === 'loading' && (
            <div className='verify-content'>
              <StatusIcon status='loading' />
              <h2 className='verify-title'>Verifying Email...</h2>
              <p className='verify-message'>Please wait while we verify your email address.</p>
            </div>
          )}
          {status === 'success' && (
            <div className='verify-content'>
              <StatusIcon status='success' />
              <h2 className='verify-title'>Email Verified!</h2>
              <p className='verify-message'>{message}</p>
              <div className='verify-info-box success'>
                <Shield style={{ width: 16, height: 16, color: '#10b981', marginRight: 6 }} />
                <span className='verify-info-text'>Your account is now secure and ready to use.</span>
              </div>
              <p className='verify-countdown'>Redirecting to login in {countdown} seconds...</p>
            </div>
          )}
          {status === 'expired' && (
            <div className='verify-content'>
              <StatusIcon status='expired' />
              <h2 className='verify-title'>Link Expired</h2>
              <p className='verify-message'>{message}</p>
              <div className='verify-info-box expired'>
                <Clock style={{ width: 16, height: 16, color: '#f59e0b', marginRight: 6 }} />
                <span className='verify-info-text'>This link is no longer valid. Please request a new one.</span>
              </div>
              <button onClick={resendVerification} disabled={isResending} className='verify-btn-primary'>
                {isResending ? 'Sending...' : 'Request New Link'}
              </button>
            </div>
          )}
          {status === 'error' && (
            <div className='verify-content'>
              <StatusIcon status='error' />
              <h2 className='verify-title'>Verification Failed</h2>
              <p className='verify-message'>{message}</p>
              <div className='verify-info-box error'>
                <p className='verify-info-text' style={{ color: '#fca5a5' }}>
                  The verification link appears to be invalid or corrupted.
                </p>
              </div>
              <button onClick={resendVerification} disabled={isResending} className='verify-btn-primary'>
                {isResending ? 'Sending...' : 'Request New Link'}
              </button>
              <a href='/contact-support' style={{ textDecoration: 'none' }}>
                <button className='verify-btn-secondary'>Contact Support</button>
              </a>
            </div>
          )}
          {status === 'resent' && (
            <div className='verify-content'>
              <StatusIcon status='resent' />
              <h2 className='verify-title'>Email Sent!</h2>
              <p className='verify-message'>{message}</p>
              <div className='verify-info-box info'>
                <p
                  className='verify-info-text'
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Mail style={{ width: 16, height: 16, color: '#60a5fa' }} />
                  Check your inbox and spam folder
                </p>
              </div>
              <a href='/' style={{ textDecoration: 'none' }}>
                <button className='verify-btn-primary'>Back to Home</button>
              </a>
            </div>
          )}
        </div>
        <p className='verify-copyright'>© 2025 MyApp. All rights reserved.</p>
      </div>
    </div>
  );
}
