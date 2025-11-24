import { createBrowserRouter } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import VerifyEmail from './VerifyEmail';
import ResetPassword from './ResetPassword';

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
  }
]);

export default router;
