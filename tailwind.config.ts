import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // 👈 هذا السطر يضمن فحص كل الملفات داخل src
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-cairo)"], // تأكد إنك رابط الخط صح
      },
    },
  },
  plugins: [],
};
export default config;
