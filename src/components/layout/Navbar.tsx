'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, Home, Globe, GraduationCap, LogIn, LogOut, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [showLoginDropdown, setShowLoginDropdown] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [user, setUser] = useState<any>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()

    // prefetch الصفحات الأساسية مسبقاً لتسريع التنقل
    useEffect(() => {
        router.prefetch('/')
        router.prefetch('/admin')
        router.prefetch('/research')
    }, [router])

    // مراقبة حالة تسجيل الدخول
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })
        return () => unsubscribe()
    }, [])

    // إغلاق الـ dropdown لما يضغط بره
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowLoginDropdown(false)
                setError('')
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // إغلاق المنيو عند تغيير الصفحة
    useEffect(() => {
        setIsOpen(false)
        setShowLoginDropdown(false)
    }, [pathname])

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const token = await userCredential.user.getIdToken()
            document.cookie = `firebase-token=${token}; path=/`
            setShowLoginDropdown(false)
            setEmail('')
            setPassword('')
            router.push('/admin')
        } catch {
            setError('البريد الإلكتروني أو كلمة المرور غلط')
        } finally {
            setLoading(false)
        }
    }, [email, password, router])

    const handleLogout = useCallback(async () => {
        await signOut(auth)
        document.cookie = 'firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        router.push('/')
    }, [router])

    const navLinks = [
        { name: 'الرئيسية', href: '/', icon: <Home size={18} /> },
        { name: 'الأبحاث العلمية', href: '/research', icon: <GraduationCap size={18} /> },
    ]

    return (
        <header
            dir="rtl"
            className={`fixed top-0 inset-x-0 z-[100] transition-all duration-700 ${scrolled ? 'py-3 md:py-4 px-4' : 'py-6 md:py-8 px-6'}`}
        >
            <nav className={`max-w-7xl mx-auto transition-all duration-700 border ${scrolled
                ? 'bg-white/70 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] border-white/80 rounded-[2rem] px-6 py-2'
                : 'bg-transparent border-transparent px-2'
                }`}>
                <div className="flex items-center justify-between">

                    {/* اللوجو */}
                    <Link href="/" prefetch={true} className="flex items-center gap-4 group relative">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-10 group-hover:opacity-30 transition-opacity duration-500"></div>
                            <div className="relative bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                <img src="/logo.png" alt="جامعة الريادة" className="w-15 h-15 object-contain mix-blend-multiply" />
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

                    {/* القائمة المركزية */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100/30 backdrop-blur-sm p-1.5 rounded-2xl border border-white/20">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    prefetch={true}
                                    className={`relative flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[13px] transition-all duration-500 overflow-hidden group ${isActive ? 'text-white' : 'text-slate-600 hover:text-blue-600'}`}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 animate-in fade-in zoom-in duration-500 -z-10"></div>
                                    )}
                                    <span className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:rotate-12'}`}>
                                        {link.icon}
                                    </span>
                                    {link.name}
                                </Link>
                            )
                        })}

                        {user && (
                            <Link
                                href="/admin"
                                prefetch={true}
                                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[13px] transition-all duration-500 overflow-hidden group ${pathname === '/admin' ? 'text-white' : 'text-slate-600 hover:text-blue-600'}`}
                            >
                                {pathname === '/admin' && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 -z-10"></div>
                                )}
                                <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform duration-500" />
                                لوحة التحكم
                            </Link>
                        )}
                    </div>

                    {/* أدوات التفاعل */}
                    <div className="flex items-center gap-3">
                        <button className="hidden lg:flex items-center gap-2 bg-white/60 hover:bg-white text-slate-700 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm border border-slate-100 group">
                            <Globe size={16} className="text-blue-500 group-hover:rotate-180 transition-transform duration-1000" />
                            English
                        </button>

                        <div className="relative hidden md:block" ref={dropdownRef}>
                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm border border-red-100 group"
                                >
                                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    خروج
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setShowLoginDropdown(!showLoginDropdown); setError('') }}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm group"
                                >
                                    <Lock size={16} className="group-hover:rotate-12 transition-transform" />
                                    تسجيل دخول
                                </button>
                            )}

                            {showLoginDropdown && !user && (
                                <div className="absolute left-0 top-full mt-3 w-80 bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                            <Lock size={18} />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 text-sm">تسجيل دخول</p>
                                            <p className="text-slate-400 text-[10px] font-bold">للمسؤولين فقط</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="relative">
                                            <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                placeholder="البريد الإلكتروني"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 transition-all text-right"
                                                required
                                            />
                                        </div>

                                        <div className="relative">
                                            <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="كلمة المرور"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pr-11 pl-11 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm placeholder:text-slate-300 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 transition-all text-right"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        {error && (
                                            <p className="text-red-500 text-xs font-black text-center bg-red-50 py-2 px-4 rounded-xl">
                                                {error}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <><Loader2 size={16} className="animate-spin" /> جاري الدخول...</>
                                            ) : (
                                                <><LogIn size={16} /> دخول</>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md text-slate-800 rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-90"
                        >
                            {isOpen ? <X size={24} className="animate-in spin-in duration-300" /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* قائمة الموبايل */}
                <div className={`md:hidden absolute top-full inset-x-4 mt-4 transition-all duration-700 ${isOpen ? 'opacity-100 translate-y-0 visible scale-100' : 'opacity-0 -translate-y-10 invisible scale-95'}`}>
                    <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-white flex flex-col gap-3">
                        <div className="text-xs font-black text-slate-400 mb-2 px-4 uppercase tracking-widest italic">الملاحة السريعة</div>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                prefetch={true}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center justify-between p-5 rounded-3xl font-black text-lg transition-all ${pathname === link.href ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={pathname === link.href ? 'text-white' : 'text-blue-600'}>{link.icon}</span>
                                    {link.name}
                                </div>
                                <div className={`w-2 h-2 rounded-full ${pathname === link.href ? 'bg-white' : 'bg-slate-200'}`}></div>
                            </Link>
                        ))}

                        {user && (
                            <Link
                                href="/admin"
                                prefetch={true}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-5 rounded-3xl font-black text-lg transition-all text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-100"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-blue-600"><LayoutDashboard size={18} /></span>
                                    لوحة التحكم
                                </div>
                            </Link>
                        )}

                        <div className="mt-4 pt-6 border-t border-slate-100 space-y-3">
                            <button className="w-full bg-slate-100 text-slate-700 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 active:scale-95 transition-transform">
                                <Globe size={20} />
                                التبديل إلى English
                            </button>

                            {user ? (
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-red-50 text-red-600 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 active:scale-95 transition-transform border border-red-100"
                                >
                                    <LogOut size={20} />
                                    تسجيل الخروج
                                </button>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="البريد الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm placeholder:text-slate-300 outline-none text-right"
                                    />
                                    <input
                                        type="password"
                                        placeholder="كلمة المرور"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-800 text-sm placeholder:text-slate-300 outline-none text-right"
                                    />
                                    {error && <p className="text-red-500 text-xs font-black text-center">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                                        دخول الأدمن
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}