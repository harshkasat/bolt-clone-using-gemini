export const BACKEND_URL = import.meta.env.VITE_LOCAL_BACKEND_URL
    ? `http://localhost:3000`
    : `https://cognito-backend.vercel.app`;
