'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Home, Globe, GraduationCap } from 'lucide-react'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()

    // مراقبة التمرير لتحويل النافبار إلى كبسولة زجاجية
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'الرئيسية', href: '/', icon: <Home size={18} /> },
        { name: 'الأبحاث العلمية', href: '/research', icon: <GraduationCap size={18} /> },
        { name: 'لوحة التحكم', href: '/admin', icon: <LayoutDashboard size={18} /> },
    ]

    return (
        <header
            dir="rtl"
            className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ${scrolled
                ? 'py-3 md:py-4 px-4'
                : 'py-6 md:py-8 px-6'
                }`}
        >
            <nav className={`max-w-7xl mx-auto transition-all duration-700 border ${scrolled
                ? 'bg-white/70 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-white/80 rounded-[2rem] px-6 py-2'
                : 'bg-transparent border-transparent px-2'
                }`}>
                <div className="flex items-center justify-between">

                    {/* اللوجو الجديد: هوية جامعة الريادة */}
                    <Link href="/" className="flex items-center gap-4 group relative">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-10 group-hover:opacity-30 transition-opacity duration-500"></div>

                            {/* إطار اللوجو الاحترافي */}
                            <div className="relative bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                <img
                                    src="/logo.png"
                                    alt="جامعة الريادة"
                                    className="w-15 h-15 object-contain mix-blend-multiply"                                // في حال عدم وجود الصورة بعد، سيظهر كإطار فارغ أنيق
                                />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-700 transition-colors">
                                مكتبة كلية التمريض
                            </span>
                            <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-1.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                جامعة الريادة للعلوم والتكنولوجيا
                            </span>
                        </div>
                    </Link>

                    {/* القائمة المركزية (الديسكتوب): تصميم الكبسولة الزجاجية */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100/30 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[13px] transition-all duration-500 overflow-hidden group ${isActive
                                        ? 'text-white'
                                        : 'text-slate-600 hover:text-blue-600'
                                        }`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 animate-in fade-in zoom-in duration-500 -z-10"></div>
                                    )}
                                    <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:rotate-12'}`}>
                                        {link.icon}
                                    </span>
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* أدوات التفاعل */}
                    <div className="flex items-center gap-3">
                        <button className="hidden lg:flex items-center gap-2 bg-white/60 hover:bg-white text-slate-700 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm border border-slate-100 group">
                            <Globe size={16} className="text-blue-500 group-hover:rotate-180 transition-transform duration-1000" />
                            English
                        </button>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md text-slate-800 rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90"
                        >
                            {isOpen ? <X size={24} className="animate-in spin-in duration-300" /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* قائمة الموبايل المطورة */}
                <div className={`md:hidden absolute top-full inset-x-4 mt-4 transition-all duration-700 ${isOpen
                    ? 'opacity-100 translate-y-0 visible scale-100'
                    : 'opacity-0 -translate-y-10 invisible scale-95'
                    }`}>
                    <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-white flex flex-col gap-3">
                        <div className="text-xs font-black text-slate-400 mb-2 px-4 uppercase tracking-widest italic">الملاحة السريعة</div>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between p-5 rounded-3xl font-black text-lg transition-all ${pathname === link.href
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={pathname === link.href ? 'text-white' : 'text-blue-600'}>
                                        {link.icon}
                                    </span>
                                    {link.name}
                                </div>
                                <div className={`w-2 h-2 rounded-full ${pathname === link.href ? 'bg-white' : 'bg-slate-200'}`}></div>
                            </Link>
                        ))}

                        <div className="mt-4 pt-6 border-t border-slate-100">
                            <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                <Globe size={20} />
                                التبديل إلى English
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}