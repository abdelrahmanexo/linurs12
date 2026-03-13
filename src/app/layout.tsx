import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-cairo",
  display: 'swap', 
});

export const metadata: Metadata = {
  title: "مكتبة التمريض الرقمية | Smart Nursing Library",
  description: "المرجع الرقمي الأول والأشمل لطلاب التمريض - كتب، أبحاث، ومصادر طبية موثوقة.",
  keywords: ["تمريض", "كتب طبية", "أبحاث تمريض", "مكتبة رقمية", "Nursing Books"],
  authors: [{ name: "Nursing Library Team" }],
  icons: {
    icon: "/favicon.ico", 
  }
};

export const viewport: Viewport = {
  themeColor: "#1e1b4b", 
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className={`${cairo.variable} font-sans antialiased bg-slate-50 text-slate-900 flex flex-col min-h-screen relative`}>

        <div className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none">
          <div
            className="w-full h-full animate-soft-float"
            style={{
              backgroundImage: "url('/college.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(20%) brightness(0.9)', 
              opacity: 100 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 via-white/80 to-blue-50/50" />
        </div>


        <main className="flex-grow w-full relative">
          {children}
        </main>

        <footer className="relative z-10 py-16 bg-white/40 backdrop-blur-xl border-t border-slate-200/60 mt-20">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-right">

              <div className="space-y-4">
                <h4 className="text-2xl font-black text-indigo-900">مكتبة التمريض</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  نسعى لتوفير أفضل المصادر العلمية الموثوقة لدعم الكوادر التمريضية في مسيرتهم التعليمية.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full opacity-30"></div>
                <div className="text-4xl">🩺</div>
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full opacity-30"></div>
              </div>

              <div className="flex flex-col md:items-end gap-4">
                <p className="text-slate-800 font-bold">روابط سريعة</p>
                <div className="flex gap-6 text-sm font-bold text-slate-400">
                  <a href="#" className="hover:text-indigo-600 transition-colors">عن الكلية</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">اتصل بنا</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">الرئيسية</a>
                </div>
              </div>

            </div>

            <div className="mt-12 pt-8 border-t border-slate-200/50 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                All Rights Reserved © {new Date().getFullYear()} • Nursing Digital Library
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}