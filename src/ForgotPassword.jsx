import { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import api from './api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState('loading');
    setError('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        setState('error');
        return;
      }
      await api.post('/users/forgot-password', { email });
      setState('success');
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
      setState('error');
    }
  };

  const handleResend = () => {
    setState('idle');
    setError('');
  };

  return (
    <div className='forgot-bg'>
      <div className='forgot-container'>
        <a href='/login/oauth' className='forgot-back'>
          <ArrowLeft style={{ width: 20, height: 20, marginRight: 8 }} />
          Back to Login
        </a>
        <div className='forgot-card'>
          {state !== 'success' ? (
            <div>
              <div className='forgot-header'>
                <div className='forgot-icon'>
                  <Mail style={{ width: 40, height: 40, color: '#3b82f6' }} />
                </div>
                <h1 className='forgot-title'>Reset Password</h1>
                <p className='forgot-desc'>
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>
              <form className='forgot-form-container' onSubmit={handleSubmit}>
                <label htmlFor='email' className='forgot-label'>
                  Email Address
                </label>
                <div className='forgot-input-wrap'>
                  <input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={state === 'loading'}
                    className='forgot-input'
                  />
                  <Mail
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      width: 20,
                      height: 20,
                      color: '#3b82f6'
                    }}
                  />
                </div>
                {error && (
                  <div className='forgot-error'>
                    <span>
                      <Send style={{ width: 16, height: 16, marginRight: 4 }} />
                    </span>
                    {error}
                  </div>
                )}
                <button type='submit' disabled={state === 'loading'} className='forgot-btn'>
                  {state === 'loading' ? (
                    <>
                      <Loader2 style={{ width: 18, height: 18, marginRight: 6 }} className='forgot-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send style={{ width: 18, height: 18, marginRight: 6 }} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className='success-info'>
                <div className='success-info-header'>
                  <Sparkles style={{ width: 20, height: 20, color: '#60a5fa', flexShrink: 0, marginTop: 2 }} />
                  <div className='success-info-content'>
                    <p className='success-info-title'>Next steps:</p>
                    <ul className='success-info-list'>
                      <li>Check your email inbox for the reset link</li>
                      <li>
                        The link will expire in <strong>1 hour</strong>
                      </li>
                      <li>Don't forget to check your spam folder</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button onClick={handleResend} className='success-btn-primary'>
                Send Another Link
              </button>
              <a href='/' style={{ textDecoration: 'none' }}>
                <button className='success-btn-secondary'>Back to home</button>
              </a>
            </div>
          )}
        </div>
        <p className='forgot-copyright'>© 2025 MyApp. All rights reserved.</p>
      </div>
    </div>
  );
}
