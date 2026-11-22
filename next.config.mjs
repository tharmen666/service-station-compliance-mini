/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    VITE_FIREBASE_API_KEY:
      process.env.VITE_FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    VITE_FIREBASE_AUTH_DOMAIN:
      process.env.VITE_FIREBASE_AUTH_DOMAIN ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    VITE_FIREBASE_PROJECT_ID:
      process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    VITE_FIREBASE_APP_ID:
      process.env.VITE_FIREBASE_APP_ID ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    VITE_FIREBASE_APPCHECK_DEBUG_TOKEN:
      process.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ??
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ??
      "",
    VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY:
      process.env.VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY ??
      process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY ??
      "",
  },
};

export default nextConfig;
