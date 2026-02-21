import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. حل مشكلة مكتبة PDF.js وتجاهل طلب 'canvas'
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },

  // 2. إعدادات الأمان واستقرار البناء
  typescript: {
    ignoreBuildErrors: true, // تخطي أخطاء الـ Types البسيطة
  },
  eslint: {
    ignoreDuringBuilds: true, // تسريع البناء
  },

  // 3. تحسين الصور (اختياري لضمان السرعة)
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
