import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import api from './api';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    setToken(resetToken || '');
    if (!resetToken) {
      setStatus('error');
      setMessage('Invalid or missing token.');
      return;
    }
    verifyForgotToken(resetToken);
  }, []);

  const verifyForgotToken = async (forgotToken) => {
    try {
      const response = await api.post('/users/verify-forgot-password', {
        forgot_password_token: forgotToken
      });
      setStatus('success');
      setMessage(response.data.message || 'Token verified. You can now reset your password.');
      setShowReset(true);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to verify token.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetStatus('loading');
    setResetMessage('');
    if (!password || !confirmPassword) {
      setResetStatus('error');
      setResetMessage('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setResetStatus('error');
      setResetMessage('Passwords do not match.');
      return;
    }
    try {
      const response = await api.post('/users/reset-password', {
        password,
        confirm_password: confirmPassword,
        forgot_password_token: token
      });
      setResetStatus('success');
      setResetMessage(response.data.message || 'Password reset successfully! You can now log in.');
    } catch (error) {
      setResetStatus('error');
      setResetMessage(error.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className='verify-bg'>
      <div className='verify-container'>
        <a href='/' className='verify-back'>
          <ArrowLeft style={{ width: 20, height: 20, marginRight: 8 }} />
          Back to Home
        </a>
        <div className='verify-card'>
          {status === 'loading' && (
            <div className='verify-content'>
              <Loader2 className='verify-icon' style={{ color: '#3b82f6' }} />
              <h2 className='verify-title'>Verifying Token...</h2>
              <p className='verify-message'>Please wait while we verify your reset link.</p>
            </div>
          )}
          {status === 'success' && (
            <div className='verify-content'>
              <CheckCircle className='verify-icon' style={{ color: '#10b981' }} />
              <h2 className='verify-title'>Token Verified!</h2>
              <p className='verify-message'>{message}</p>
              {showReset && (
                <div className='reset-dialog'>
                  <form className='reset-form' onSubmit={handleResetPassword}>
                    <div className='reset-field'>
                      <label htmlFor='password'>New Password</label>
                      <input
                        id='password'
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='reset-input'
                        autoComplete='new-password'
                        required
                      />
                    </div>
                    <div className='reset-field'>
                      <label htmlFor='confirmPassword'>Confirm Password</label>
                      <input
                        id='confirmPassword'
                        type='password'
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className='reset-input'
                        autoComplete='new-password'
                        required
                      />
                    </div>
                    {resetMessage && <div className={`reset-message ${resetStatus}`}>{resetMessage}</div>}
                    <button type='submit' className='verify-btn-primary' disabled={resetStatus === 'loading'}>
                      {resetStatus === 'loading' ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
          {status === 'error' && (
            <div className='verify-content'>
              <XCircle className='verify-icon' style={{ color: '#ef4444' }} />
              <h2 className='verify-title'>Verification Failed</h2>
              <p className='verify-message'>{message}</p>
            </div>
          )}
        </div>
        <p className='verify-copyright'>© 2025 MyApp. All rights reserved.</p>
      </div>
    </div>
  );
}
