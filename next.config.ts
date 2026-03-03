import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* إضافة كائن turbopack فارغ لإخبار المحرك أنك على علم بالتعارض 
     وهذا سيسمح لـ Vercel بإتمام عملية الـ Build بنجاح.
  */
  turbopack: {},

  webpack: (config) => {
    // هذا السطر يخبر ويب-باك بتجاهل مكتبة canvas
    config.resolve.alias.canvas = false;

    // حلول إضافية قد تحتاجها لبعض الحزم الخاصة بترميز النصوص
    config.resolve.alias.encoding = false;

    return config;
  },
};

export default nextConfig;
