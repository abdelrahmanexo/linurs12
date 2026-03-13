import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // هذا السطر يخبر ويب-باك بتجاهل مكتبة canvas
    config.resolve.alias.canvas = false;

    // حلول إضافية قد تحتاجها لبعض الحزم الخاصة بترميز النصوص
    config.resolve.alias.encoding = false;

    return config;
  },
};

export default nextConfig;