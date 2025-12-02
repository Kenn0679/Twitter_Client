import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { Link } from 'react-router-dom';
import VideoStream from './components/VideoStream';
import HLSVideoStream from './components/HLSVideoStream';

//static files served using express server at your server port
const videoPath = 'http://localhost:5000/static/videos-stream/ylFNxKJq6vW_wqAQXtbZE.mp4';
const hlsVideoPath = 'http://localhost:5000/static/videos-hls/Ib9JcqakV6M5B7Ww1vmFx/master.m3u8';

const getGoogleAuthURL = () => {
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_REDIRECT_URI } = import.meta.env;
  const url = `https://accounts.google.com/o/oauth2/v2/auth`;
  const query = {
    client_id: VITE_GOOGLE_CLIENT_ID,
    redirect_uri: VITE_GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'].join(
      ' '
    ),
    prompt: 'consent',
    access_type: 'offline'
  };

  const queryString = new URLSearchParams(query).toString();
  return `${url}?${queryString}`;
};

const googleOAuthURL = getGoogleAuthURL();

export default function Home() {
  const isAuthenticated = Boolean(localStorage.getItem('access_token'));
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  return (
    <>
      <div>
        <span>
          <img src={viteLogo} className='logo' alt='Vite logo' />
        </span>
        <span>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </span>
      </div>

      <VideoStream src={videoPath} title='Progressive Video Streaming' width='85%' />

      <HLSVideoStream
        src={hlsVideoPath}
        title='Sprite Fight'
        sectionTitle='HLS Adaptive Streaming'
        thumbnails='https://files.vidstack.io/sprite-fight/thumbnails.vtt'
      />

      <h1>Google Oauth 2.0</h1>

      <div className='read-the-docs'>
        {isAuthenticated ? (
          <div>
            <span style={{ display: 'block' }}>
              {(() => {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  try {
                    const user = JSON.parse(userStr);
                    return (
                      <>
                        <div style={{ fontSize: '20px' }}>
                          You are logged in as{' '}
                          <span className='verify-btn-primary' style={{ padding: '2px 8px', borderRadius: 6 }}>
                            {user.name}
                          </span>{' '}
                          with email{' '}
                          <span className='verify-btn-primary' style={{ padding: '2px 8px', borderRadius: 6 }}>
                            {user.email}
                          </span>{' '}
                          successfully!
                        </div>
                      </>
                    );
                  } catch {
                    return 'You have logged in successfully!';
                  }
                }
                return 'You have logged in successfully!';
              })()}
            </span>
            <button className='verify-btn-primary' onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div>
            <span style={{ display: 'block' }}>Please log in to continue.</span>
            <button
              className='verify-btn-primary'
              style={{ marginTop: 12 }}
              onClick={() => (window.location.href = googleOAuthURL)}
            >
              Login with Google
            </button>
          </div>
        )}
      </div>
    </>
  );
}
