import { createBrowserRouter } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import VerifyEmail from './VerifyEmail';
import ResetPassword from './ResetPassword';
import WebSocketChat from './WebSocketChat';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login/oauth',
    element: <Login />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/chat',
    element: <WebSocketChat />
  }
]);

export default router;
