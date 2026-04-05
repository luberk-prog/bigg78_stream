import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function decodeJwtResponse(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window.atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

export default function GoogleLoginButton() {
  const btnContainerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only initialize if google identity script has loaded
    if (window.google?.accounts?.id && btnContainerRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        btnContainerRef.current,
        { 
          theme: 'filled_black', 
          size: 'large', 
          type: 'standard', 
          shape: 'pill', 
          text: 'continue_with',
          width: 320
        }
      );
    }
  }, [login, navigate]);

  const handleCredentialResponse = (response) => {
    try {
      const decodedPayload = decodeJwtResponse(response.credential);
      
      const userData = {
        name: decodedPayload.name,
        email: decodedPayload.email,
        picture: decodedPayload.picture
      };

      login(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to decode Google Credential', error);
    }
  };

  return (
    <div className="flex justify-center w-full my-2">
      <div ref={btnContainerRef}></div>
    </div>
  );
}
