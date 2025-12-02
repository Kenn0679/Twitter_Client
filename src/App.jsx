import { RouterProvider } from 'react-router-dom';
import './App.css';
import router from './router';
import { useEffect } from 'react';
import api from './api';

function App() {
  useEffect(() => {
    const access_token = localStorage.getItem('access_token');
    
    // Chỉ fetch user data nếu có access_token
    if (access_token) {
      api
        .get('/users/me')
        .then((response) => {
          console.log('User data:', response.data);
          // API trả về format: { success: true, message: "...", data: { user: {...} } }
          // hoặc { user: {...} }
          const userData = response.data.user || response.data.data?.user;
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          // Nếu lỗi 401, interceptor sẽ xử lý refresh token hoặc redirect
        });
    }
  }, []);
  return <RouterProvider router={router} />;
}

export default App;
