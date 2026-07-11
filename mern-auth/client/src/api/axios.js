import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return `${protocol}//${hostname}`;
  }
  return 'http://localhost:5000';
};

const instance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export default instance;
