'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
    Upload, FileText, CheckCircle, AlertCircle,
    Hash, User, Layout, ArrowRight,
    ShieldCheck, Loader2, Image as ImageIcon,
    Type, ChevronDown, Book, LayoutDashboard,
    Trash2, Edit3, Save, X, Plus, Search,
    Users, Settings, BarChart2, Eye,
    RefreshCw, BookOpen, GraduationCap, Camera,
    Star, Globe, Link2, Award,
    AlignLeft, LayoutGrid,
    ChevronLeft, ChevronRight,
    Library, Facebook, Phone, Mail, MessageCircle
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

type Tab = 'dashboard' | 'books' | 'upload' | 'categories' | 'team' | 'dean' | 'settings'

interface Book {
    id: string; title: string; author: string; description: string
    page_count: number; file_url: string; cover_url: string
    type: string; category: string; created_at: string; featured?: boolean
}
interface TeamMember {
    id: string; name: string; title: string; specialty: string
    image_url: string; email?: string; order?: number
}
interface Category { id: string; key: string; label: string; order: number }
interface SiteSettings {
    id?: string; site_title: string; site_subtitle: string; hero_description: string
    dean_name: string; dean_title: string; dean_message: string; dean_image_url: string
    total_books: number; total_researches: number; total_students: number
    contact_email: string; contact_phone: string; facebook_url: string; whatsapp_url: string
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ status, onClose }: { status: { type: 'success' | 'error', msg: string } | null, onClose: () => void }) {
    useEffect(() => { if (status) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) } }, [status, onClose])
    if (!status) return null
    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-8 py-4 rounded-2xl flex items-center gap-4 font-black shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            {status.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
            <span>{status.msg}</span>
            <button onClick={onClose} className="opacity-70 hover:opacity-100"><X size={18} /></button>
        </div>
    )
}

// ── Main ───────────────────────────────────────────────────
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [books, setBooks] = useState<Book[]>([])
    const [team, setTeam] = useState<TeamMember[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [settings, setSettings] = useState<SiteSettings>({
        site_title: '', site_subtitle: '', hero_description: '',
        dean_name: '', dean_title: '', dean_message: '', dean_image_url: '',
        total_books: 0, total_researches: 0, total_students: 0,
        contact_email: '', contact_phone: '', facebook_url: '', whatsapp_url: ''
    })
    const [stats, setStats] = useState({ books: 0, researches: 0, team: 0 })
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')

    useEffect(() => { fetchAll() }, [])

    const fetchAll = async () => {
        setLoading(true)
        await Promise.all([fetchBooks(), fetchTeam(), fetchSettings(), fetchCategories()])
        setLoading(false)
    }
    const fetchBooks = async () => {
        const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
        if (data) { setBooks(data); setStats(p => ({ ...p, books: data.filter(b => b.type === 'book').length, researches: data.filter(b => b.type === 'research').length })) }
    }
    const fetchTeam = async () => {
        const { data } = await supabase.from('team').select('*').order('order', { ascending: true })
        if (data) { setTeam(data); setStats(p => ({ ...p, team: data.length })) }
    }
    const fetchSettings = async () => {
        const { data } = await supabase.from('site_settings').select('*').single()
        if (data) setSettings(data)
    }
    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('order', { ascending: true })
        if (data) setCategories(data)
    }
    const notify = useCallback((type: 'success' | 'error', msg: string) => setStatus({ type, msg }), [])

    const filteredBooks = books.filter(b =>
        (b.title?.includes(searchQuery) || b.author?.includes(searchQuery)) &&
        (filterCategory === 'all' || b.category === filterCategory)
    )

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard size={20} /> },
        { id: 'books', label: 'المراجع', icon: <BookOpen size={20} /> },
        { id: 'upload', label: 'رفع جديد', icon: <Upload size={20} /> },
        { id: 'categories', label: 'الأقسام', icon: <LayoutGrid size={20} /> },
        { id: 'team', label: 'الكوادر', icon: <Users size={20} /> },
        { id: 'dean', label: 'العميد', icon: <GraduationCap size={20} /> },
        { id: 'settings', label: 'الإعدادات', icon: <Settings size={20} /> },
    ]

    return (
        <div className="min-h-screen bg-slate-50 flex" dir="rtl">

            {/* Sidebar */}
            <aside style={{ width: sidebarOpen ? 288 : 0 }}
                className="bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl overflow-hidden transition-all duration-300">
                <div className="p-8 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30 flex-shrink-0">
                            <Library size={24} />
                        </div>
                        <div>
                            <h1 className="font-black text-lg leading-tight whitespace-nowrap">لوحة التحكم</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold whitespace-nowrap">Admin Dashboard</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all whitespace-nowrap
                                ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                            {tab.icon}{tab.label}
                            {tab.id === 'upload' && <span className="mr-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">+</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-white/10 flex-shrink-0">
                    <Link href="/" className="flex items-center gap-3 px-5 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black text-sm whitespace-nowrap">
                        <Library size={20} /> العودة للمكتبة
                    </Link>
                </div>
            </aside>

            {/* Toggle sidebar button */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ right: sidebarOpen ? 288 : 0 }}
                className="fixed top-1/2 -translate-y-1/2 z-50 w-7 h-16 bg-slate-800 hover:bg-blue-600 text-white flex items-center justify-center rounded-l-2xl shadow-xl transition-all duration-300">
                {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Main content */}
            <main style={{ marginRight: sidebarOpen ? 288 : 0 }} className="flex-1 p-10 transition-all duration-300 min-w-0">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <p className="text-slate-400 font-bold text-sm mt-1">
                            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                            <Library size={16} /> المكتبة
                        </Link>
                        <button onClick={fetchAll} className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-black text-sm shadow-sm">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> تحديث
                        </button>
                    </div>
                </div>

                {activeTab === 'dashboard' && <DashboardTab stats={stats} books={books} />}
                {activeTab === 'books' && <BooksTab books={filteredBooks} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterCategory={filterCategory} setFilterCategory={setFilterCategory} categories={categories} onRefresh={fetchBooks} notify={notify} />}
                {activeTab === 'upload' && <UploadTab categories={categories} onSuccess={() => { fetchBooks(); notify('success', 'تم نشر المرجع بنجاح 🚀') }} notify={notify} />}
                {activeTab === 'categories' && <CategoriesTab categories={categories} onRefresh={fetchCategories} notify={notify} />}
                {activeTab === 'team' && <TeamTab team={team} onRefresh={fetchTeam} notify={notify} />}
                {activeTab === 'dean' && <DeanTab settings={settings} setSettings={setSettings} notify={notify} />}
                {activeTab === 'settings' && <SettingsTab settings={settings} setSettings={setSettings} notify={notify} />}
            </main>

            <Toast status={status} onClose={() => setStatus(null)} />
        </div>
    )
}

// ── Dashboard ──────────────────────────────────────────────
function DashboardTab({ stats, books }: { stats: any, books: Book[] }) {
    const cards = [
        { label: 'الكتب الأكاديمية', value: stats.books, icon: <Book size={24} />, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        { label: 'الأبحاث العلمية', value: stats.researches, icon: <FileText size={24} />, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
        { label: 'الكوادر التدريسية', value: stats.team, icon: <Users size={24} />, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
        { label: 'إجمالي المراجع', value: stats.books + stats.researches, icon: <BarChart2 size={24} />, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    ]
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((c, i) => (
                    <div key={i} className={`bg-white rounded-3xl p-6 border ${c.border} shadow-sm hover:shadow-lg transition-shadow`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${c.bg} ${c.text}`}>{c.icon}</div>
                        <p className="text-3xl font-black text-slate-900 mb-1">{c.value}</p>
                        <p className="font-bold text-slate-500 text-sm">{c.label}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-lg">آخر المراجع المضافة</h3>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Recent Uploads</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {books.slice(0, 6).length === 0
                        ? <div className="p-10 text-center text-slate-400 font-bold">لا توجد مراجع بعد</div>
                        : books.slice(0, 6).map(b => (
                            <div key={b.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
                                <div className="w-10 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" /> : <BookOpen className="m-auto mt-3 text-slate-300" size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate">{b.title}</p>
                                    <p className="text-xs text-slate-400 font-bold">{b.author}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black ${b.type === 'book' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                    {b.type === 'book' ? 'كتاب' : 'بحث'}
                                </span>
                                <span className="text-xs text-slate-300 font-bold hidden md:block">{new Date(b.created_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
}

// ── Books ──────────────────────────────────────────────────
function BooksTab({ books, searchQuery, setSearchQuery, filterCategory, setFilterCategory, categories, onRefresh, notify }:
    { books: Book[], searchQuery: string, setSearchQuery: any, filterCategory: string, setFilterCategory: any, categories: Category[], onRefresh: () => void, notify: any }) {
    const [editingBook, setEditingBook] = useState<Book | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    const handleDelete = async (book: Book) => {
        if (!confirm(`حذف "${book.title}"؟`)) return
        setDeleting(book.id)
        try {
            if (book.file_url?.includes('/nursing-books/')) {
                const p = decodeURIComponent(book.file_url.split('/nursing-books/')[1])
                if (p) await supabase.storage.from('nursing-books').remove([p])
            }
            if (book.cover_url?.includes('/nursing-books/')) {
                const p = decodeURIComponent(book.cover_url.split('/nursing-books/')[1])
                if (p) await supabase.storage.from('nursing-books').remove([p])
            }
            const { error } = await supabase.from('books').delete().eq('id', book.id)
            if (error) throw error
            notify('success', 'تم الحذف ✅'); onRefresh()
        } catch (e: any) { notify('error', 'فشل الحذف: ' + e.message) }
        finally { setDeleting(null) }
    }

    const handleSaveEdit = async () => {
        if (!editingBook) return
        setSaving(true)
        try {
            const { error } = await supabase.from('books').update({
                title: editingBook.title, author: editingBook.author,
                description: editingBook.description, type: editingBook.type,
                category: editingBook.category, featured: editingBook.featured,
            }).eq('id', editingBook.id)
            if (error) throw error
            notify('success', 'تم الحفظ ✅'); setEditingBook(null); onRefresh()
        } catch (e: any) { notify('error', 'فشل الحفظ: ' + e.message) }
        finally { setSaving(false) }
    }

    const allCats = [{ id: 'all', label: 'الكل' }, ...categories.map(c => ({ id: c.key, label: c.label }))]

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث بالعنوان أو المؤلف..."
                        className="w-full pr-12 pl-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {allCats.map(c => (
                        <button key={c.id} onClick={() => setFilterCategory(c.id)}
                            className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${filterCategory === c.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>
            <p className="text-slate-400 font-bold text-sm">{books.length} مرجع</p>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {books.length === 0
                    ? <div className="p-16 text-center text-slate-400 font-bold">لا توجد نتائج</div>
                    : <div className="divide-y divide-slate-50">
                        {books.map(book => (
                            <div key={book.id} className="flex items-center gap-5 p-5 hover:bg-slate-50 transition-colors group">
                                <div className="w-10 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {book.cover_url ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" /> : <BookOpen className="m-auto mt-3 text-slate-300" size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 truncate">{book.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400 font-bold">{book.author}</span>
                                        {book.page_count > 0 && <><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="text-xs text-slate-400 font-bold">{book.page_count} صفحة</span></>}
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${book.type === 'book' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {book.type === 'book' ? 'كتاب' : 'بحث'}
                                    </span>
                                    {book.featured && <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-600">مميز ⭐</span>}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {book.file_url && <a href={book.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"><Eye size={16} /></a>}
                                    <button onClick={() => setEditingBook(book)} className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-colors"><Edit3 size={16} /></button>
                                    <button onClick={() => handleDelete(book)} disabled={deleting === book.id} className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                                        {deleting === book.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>}
            </div>

            {editingBook && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setEditingBook(null)}>
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900">تعديل المرجع</h3>
                            <button onClick={() => setEditingBook(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><X size={20} /></button>
                        </div>
                        <div className="space-y-5">
                            {[{ key: 'title', label: 'العنوان' }, { key: 'author', label: 'المؤلف' }].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{f.label}</label>
                                    <input type="text" value={(editingBook as any)[f.key]} onChange={e => setEditingBook({ ...editingBook, [f.key]: e.target.value })}
                                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">النوع</label>
                                    <select value={editingBook.type} onChange={e => setEditingBook({ ...editingBook, type: e.target.value })}
                                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none">
                                        <option value="book">كتاب 📘</option>
                                        <option value="research">بحث 🎓</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">التخصص</label>
                                    <select value={editingBook.category} onChange={e => setEditingBook({ ...editingBook, category: e.target.value })}
                                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none">
                                        <option value="internal">تمريض باطني</option>
                                        <option value="critical">عناية مركزة</option>
                                        <option value="pediatric">تمريض أطفال</option>
                                        <option value="psych">صحة نفسية</option>
                                        <option value="ethics">أخلاقيات مهنة</option>
                                        <option value="community">صحة مجتمع</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">وصف المرجع</label>
                                <textarea value={editingBook.description || ''} onChange={e => setEditingBook({ ...editingBook, description: e.target.value })} rows={3}
                                    className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 resize-none" />
                            </div>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setEditingBook({ ...editingBook, featured: !editingBook.featured })}>
                                <div className={`w-14 h-7 rounded-full flex items-center px-1 transition-colors ${editingBook.featured ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editingBook.featured ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="font-black text-slate-700 text-sm">تمييز هذا المرجع ⭐</span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-60">
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ
                            </button>
                            <button onClick={() => setEditingBook(null)} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Upload (any format) ────────────────────────────────────
function UploadTab({ categories, onSuccess, notify }: { categories: Category[], onSuccess: () => void, notify: any }) {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [description, setDescription] = useState('')
    const [pageCount, setPageCount] = useState(0)
    const [type, setType] = useState('book')
    const [category, setCategory] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [coverPreview, setCoverPreview] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [loading, setLoading] = useState(false)

    useEffect(() => { if (categories.length > 0 && !category) setCategory(categories[0].key) }, [categories])

    const tryPDF = async (f: File) => {
        try {
            const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise
            setPageCount(pdf.numPages)
            const meta = await pdf.getMetadata()
            if ((meta.info as any)?.Title) setTitle((meta.info as any).Title)
            return pdf
        } catch { return null }
    }

    const pdfCover = async (pdf: any): Promise<Blob | null> => {
        try {
            const page = await pdf.getPage(1)
            const vp = page.getViewport({ scale: 1.5 })
            const canvas = document.createElement('canvas')
            canvas.width = vp.width; canvas.height = vp.height
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
            return new Promise(res => canvas.toBlob(b => res(b), 'image/webp', 0.85))
        } catch { return null }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return
        setFile(f)
        if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
        if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
            setLoading(true)
            const pdf = await tryPDF(f)
            if (pdf && !coverFile) {
                const blob = await pdfCover(pdf)
                if (blob) { const cf = new File([blob], 'cover.webp', { type: 'image/webp' }); setCoverFile(cf); setCoverPreview(URL.createObjectURL(blob)) }
            }
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!file || !title || !author) { notify('error', 'يرجى إدخال العنوان والمؤلف وتحديد الملف'); return }
        setLoading(true); setProgress(5)
        try {
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
            const safeName = id + '_' + file.name.replace(/[^\w.\-]/g, '_')
            const { error: fe } = await supabase.storage.from('nursing-books').upload(`files/${safeName}`, file, { upsert: true })
            if (fe) throw fe
            setProgress(55)
            const { data: { publicUrl: fileUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`files/${safeName}`)
            let coverUrl = ''
            if (coverFile) {
                const cn = `cover_${id}.webp`
                const { error: ce } = await supabase.storage.from('nursing-books').upload(`covers/${cn}`, coverFile, { upsert: true })
                if (!ce) { const { data: { publicUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`covers/${cn}`); coverUrl = publicUrl }
            }
            setProgress(85)
            const { error: de } = await supabase.from('books').insert([{ title, author, description, page_count: pageCount, file_url: fileUrl, cover_url: coverUrl, type, category }])
            if (de) throw de
            setProgress(100)
            onSuccess()
            setTitle(''); setAuthor(''); setDescription(''); setFile(null); setCoverFile(null); setCoverPreview(null); setPageCount(0)
            setTimeout(() => setProgress(0), 1000)
        } catch (e: any) { notify('error', 'فشل الرفع: ' + e.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="max-w-4xl">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">النوع</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none">
                                    <option value="book">كتاب 📘</option>
                                    <option value="research">بحث 🎓</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">التخصص</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none appearance-none">
                                    {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>
                        {[{ v: title, s: setTitle, label: 'عنوان المرجع *', ph: 'عنوان الكتاب...' }, { v: author, s: setAuthor, label: 'المؤلف *', ph: 'اسم الدكتور...' }].map((f, i) => (
                            <div key={i}>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{f.label}</label>
                                <input type="text" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph}
                                    className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                            </div>
                        ))}
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">وصف مختصر</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="وصف المرجع..."
                                className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 resize-none" />
                        </div>
                        {pageCount > 0 && (
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <Hash className="text-blue-600" size={20} />
                                <span className="font-black text-blue-700">{pageCount} صفحة — رُصد تلقائياً</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-5">
                        {/* Any file */}
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">الملف — أي صيغة مقبولة</label>
                            <input type="file" onChange={handleFileChange} className="hidden" id="any-file" />
                            <label htmlFor="any-file" className={`flex flex-col items-center justify-center w-full min-h-[160px] border-4 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                                {file ? (
                                    <div className="text-center p-5">
                                        <div className="w-14 h-14 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200"><CheckCircle size={28} /></div>
                                        <p className="font-black text-slate-700 text-sm truncate max-w-[200px] mx-auto">{file.name}</p>
                                        <p className="text-emerald-600 font-black text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB ✅</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-6">
                                        <Upload className="mx-auto mb-3 text-slate-400" size={36} />
                                        <p className="font-black text-slate-600">اسحب أي ملف هنا</p>
                                        <p className="text-slate-400 text-xs mt-1 font-bold">PDF • Word • صورة • PowerPoint • وأكثر</p>
                                    </div>
                                )}
                            </label>
                        </div>
                        {/* Cover */}
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">غلاف مخصص (اختياري)</label>
                            <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)) } }} className="hidden" id="cover-file" />
                            <label htmlFor="cover-file" className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all">
                                {coverPreview ? <img src={coverPreview} alt="" className="w-12 h-16 rounded-xl object-cover shadow" /> : <div className="w-12 h-16 rounded-xl bg-slate-200 flex items-center justify-center"><ImageIcon size={20} className="text-slate-400" /></div>}
                                <div>
                                    <p className="font-black text-slate-700 text-sm">{coverPreview ? 'تغيير الغلاف' : 'رفع صورة غلاف'}</p>
                                    <p className="text-slate-400 text-xs font-bold">يُستخرج تلقائياً من PDF</p>
                                </div>
                            </label>
                        </div>
                        {progress > 0 && (
                            <div>
                                <div className="flex justify-between text-xs font-black text-slate-500 mb-2"><span>جاري الرفع...</span><span>{progress}%</span></div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}
                        <button onClick={handleUpload} disabled={loading || !file}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors disabled:opacity-40 shadow-xl">
                            {loading ? <><Loader2 className="animate-spin" size={22} /> جاري المعالجة...</> : <><ShieldCheck size={22} /> نشر المرجع</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Categories ─────────────────────────────────────────────
function CategoriesTab({ categories, onRefresh, notify }: { categories: Category[], onRefresh: () => void, notify: any }) {
    const [editing, setEditing] = useState<Category | null>(null)
    const [newLabel, setNewLabel] = useState('')
    const [saving, setSaving] = useState(false)

    const save = async (cat: Category) => {
        setSaving(true)
        const { error } = await supabase.from('categories').update({ label: cat.label }).eq('id', cat.id)
        if (error) notify('error', error.message)
        else { notify('success', 'تم التعديل ✅'); setEditing(null); onRefresh() }
        setSaving(false)
    }
    const add = async () => {
        if (!newLabel.trim()) return
        const { error } = await supabase.from('categories').insert([{ key: 'cat_' + Date.now().toString(36), label: newLabel, order: categories.length + 1 }])
        if (error) notify('error', error.message)
        else { notify('success', 'تم الإضافة 🎉'); setNewLabel(''); onRefresh() }
    }
    const del = async (cat: Category) => {
        if (!confirm(`حذف "${cat.label}"؟`)) return
        const { error } = await supabase.from('categories').delete().eq('id', cat.id)
        if (error) notify('error', error.message)
        else { notify('success', 'تم الحذف'); onRefresh() }
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex gap-4">
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="اسم القسم الجديد..."
                    onKeyDown={e => e.key === 'Enter' && add()}
                    className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                <button onClick={add} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus size={18} /> إضافة
                </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {categories.length === 0
                    ? <div className="p-10 text-center text-slate-400 font-bold">لا توجد أقسام</div>
                    : categories.map((cat, i) => (
                        <div key={cat.id} className={`flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors group ${i < categories.length - 1 ? 'border-b border-slate-50' : ''}`}>
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center flex-shrink-0">{cat.order}</div>
                            {editing?.id === cat.id
                                ? <input type="text" value={editing.label} onChange={e => setEditing({ ...editing, label: e.target.value })} onKeyDown={e => e.key === 'Enter' && save(editing)}
                                    className="flex-1 p-3 border border-blue-300 rounded-xl font-bold text-slate-800 outline-none" autoFocus />
                                : <span className="flex-1 font-black text-slate-800">{cat.label}</span>}
                            <span className="text-xs text-slate-300 font-mono hidden md:block">{cat.key}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editing?.id === cat.id
                                    ? <button onClick={() => save(editing)} disabled={saving} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    </button>
                                    : <button onClick={() => setEditing(cat)} className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100"><Edit3 size={16} /></button>}
                                <button onClick={() => del(cat)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

// ── Team ───────────────────────────────────────────────────
function TeamTab({ team, onRefresh, notify }: { team: TeamMember[], onRefresh: () => void, notify: any }) {
    const [editing, setEditing] = useState<TeamMember | null>(null)
    const [adding, setAdding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [imgFile, setImgFile] = useState<File | null>(null)
    const [imgPreview, setImgPreview] = useState<string | null>(null)
    const [newM, setNewM] = useState({ name: '', title: '', specialty: '', image_url: '' })

    const onImg = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }
    const uploadImg = async (id: string) => {
        if (!imgFile) return null
        const ext = imgFile.name.split('.').pop()
        await supabase.storage.from('nursing-books').upload(`team/${id}.${ext}`, imgFile, { upsert: true })
        const { data: { publicUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`team/${id}.${ext}`)
        return publicUrl
    }

    const handleDelete = async (m: TeamMember) => {
        if (!confirm(`حذف ${m.name}؟`)) return
        setDeleting(m.id)
        try {
            if (m.image_url?.includes('/nursing-books/')) { const p = m.image_url.split('/nursing-books/')[1]; if (p) await supabase.storage.from('nursing-books').remove([p]) }
            const { error } = await supabase.from('team').delete().eq('id', m.id)
            if (error) throw error
            notify('success', 'تم الحذف ✅'); onRefresh()
        } catch (e: any) { notify('error', e.message) }
        finally { setDeleting(null) }
    }

    const handleEdit = async () => {
        if (!editing) return; setSaving(true)
        try {
            let imgUrl = editing.image_url
            if (imgFile) imgUrl = await uploadImg(editing.id) || imgUrl
            const { error } = await supabase.from('team').update({ name: editing.name, title: editing.title, specialty: editing.specialty, image_url: imgUrl }).eq('id', editing.id)
            if (error) throw error
            notify('success', 'تم الحفظ ✅'); setEditing(null); setImgFile(null); setImgPreview(null); onRefresh()
        } catch (e: any) { notify('error', e.message) }
        finally { setSaving(false) }
    }

    const handleAdd = async () => {
        if (!newM.name || !newM.title) { notify('error', 'يرجى إدخال الاسم والمسمى'); return }
        setSaving(true)
        try {
            const tempId = Date.now().toString()
            let imgUrl = ''; if (imgFile) imgUrl = await uploadImg(tempId) || ''
            const { error } = await supabase.from('team').insert([{ ...newM, image_url: imgUrl, order: team.length + 1 }])
            if (error) throw error
            notify('success', 'تم الإضافة 🎉'); setAdding(false); setNewM({ name: '', title: '', specialty: '', image_url: '' }); setImgFile(null); setImgPreview(null); onRefresh()
        } catch (e: any) { notify('error', e.message) }
        finally { setSaving(false) }
    }

    const Form = ({ data, setData, onSave, onCancel, fTitle }: any) => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onCancel}>
            <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900">{fTitle}</h3>
                    <button onClick={onCancel} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><X size={20} /></button>
                </div>
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 mb-3 border-4 border-white shadow-xl">
                        {(imgPreview || data.image_url) ? <img src={imgPreview || data.image_url} alt="" className="w-full h-full object-cover" /> : <User className="m-auto mt-6 text-slate-300" size={32} />}
                    </div>
                    <input type="file" accept="image/*" onChange={onImg} className="hidden" id="m-img" />
                    <label htmlFor="m-img" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs cursor-pointer hover:bg-blue-100">
                        <Camera size={14} /> تغيير الصورة
                    </label>
                </div>
                <div className="space-y-4">
                    {[{ k: 'name', ph: 'الاسم الكامل *' }, { k: 'title', ph: 'المسمى الوظيفي *' }, { k: 'specialty', ph: 'التخصص' }].map(f => (
                        <input key={f.k} type="text" value={data[f.k]} onChange={e => setData({ ...data, [f.k]: e.target.value })} placeholder={f.ph}
                            className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                    ))}
                </div>
                <div className="flex gap-4 mt-6">
                    <button onClick={onSave} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-60">
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} حفظ
                    </button>
                    <button onClick={onCancel} className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-200">إلغاء</button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <button onClick={() => { setAdding(true); setImgPreview(null); setImgFile(null) }} className="flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                <Plus size={20} /> إضافة عضو جديد
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(m => (
                    <div key={m.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                                {m.image_url ? <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" /> : <User className="m-auto mt-4 text-slate-300" size={24} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-800 truncate">{m.name}</p>
                                <p className="text-xs text-slate-500 font-bold truncate">{m.title}</p>
                                {m.specialty && <p className="text-xs text-blue-500 font-bold mt-0.5">{m.specialty}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditing(m); setImgPreview(null); setImgFile(null) }} className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-600 font-black text-xs flex items-center justify-center gap-1 hover:bg-amber-100">
                                <Edit3 size={14} /> تعديل
                            </button>
                            <button onClick={() => handleDelete(m)} disabled={deleting === m.id} className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center gap-1 hover:bg-rose-100">
                                {deleting === m.id ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> حذف</>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {editing && <Form data={editing} setData={setEditing} onSave={handleEdit} onCancel={() => { setEditing(null); setImgPreview(null) }} fTitle="تعديل بيانات العضو" />}
            {adding && <Form data={newM} setData={setNewM} onSave={handleAdd} onCancel={() => { setAdding(false); setImgPreview(null) }} fTitle="إضافة عضو جديد" />}
        </div>
    )
}

// ── Dean ───────────────────────────────────────────────────
function DeanTab({ settings, setSettings, notify }: { settings: SiteSettings, setSettings: any, notify: any }) {
    const [saving, setSaving] = useState(false)
    const [imgFile, setImgFile] = useState<File | null>(null)
    const [imgPreview, setImgPreview] = useState<string | null>(null)

    const handleSave = async () => {
        setSaving(true)
        try {
            let deanImg = settings.dean_image_url
            if (imgFile) {
                const ext = imgFile.name.split('.').pop()
                await supabase.storage.from('nursing-books').upload(`settings/dean.${ext}`, imgFile, { upsert: true })
                const { data: { publicUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`settings/dean.${ext}`)
                deanImg = publicUrl
            }
            const updated = { ...settings, dean_image_url: deanImg }
            const { error } = settings.id ? await supabase.from('site_settings').update(updated).eq('id', settings.id) : await supabase.from('site_settings').insert([updated])
            if (error) throw error
            setSettings(updated); notify('success', 'تم حفظ بيانات العميد ✅'); setImgFile(null); setImgPreview(null)
        } catch (e: any) { notify('error', e.message) }
        finally { setSaving(false) }
    }

    return (
        <div className="max-w-3xl">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><GraduationCap className="text-blue-600" /> بيانات العميد</h3>
                <div className="flex flex-col md:flex-row gap-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-2xl">
                            {(imgPreview || settings.dean_image_url) ? <img src={imgPreview || settings.dean_image_url} alt="" className="w-full h-full object-cover" /> : <User className="m-auto mt-14 text-slate-300" size={40} />}
                        </div>
                        <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setImgPreview(URL.createObjectURL(f)) } }} className="hidden" id="dean-img" />
                        <label htmlFor="dean-img" className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm cursor-pointer hover:bg-blue-100">
                            <Camera size={18} /> تغيير الصورة
                        </label>
                    </div>
                    <div className="flex-1 space-y-5">
                        {[{ k: 'dean_name', l: 'اسم العميد', ph: 'أ.د / ...' }, { k: 'dean_title', l: 'المسمى الوظيفي', ph: 'عميد كلية التمريض...' }].map(f => (
                            <div key={f.k}>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{f.l}</label>
                                <input type="text" value={(settings as any)[f.k]} onChange={e => setSettings({ ...settings, [f.k]: e.target.value })} placeholder={f.ph}
                                    className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />
                            </div>
                        ))}
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">كلمة العميد</label>
                            <textarea value={settings.dean_message} onChange={e => setSettings({ ...settings, dean_message: e.target.value })} rows={5} placeholder="كلمة العميد للطلاب..."
                                className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 resize-none" />
                        </div>
                    </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {saving ? <><Loader2 className="animate-spin" size={22} /> جاري الحفظ...</> : <><Save size={22} /> حفظ بيانات العميد</>}
                </button>
            </div>
        </div>
    )
}

// ── Settings ───────────────────────────────────────────────
function SettingsTab({ settings, setSettings, notify }: { settings: SiteSettings, setSettings: any, notify: any }) {
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = settings.id ? await supabase.from('site_settings').update(settings).eq('id', settings.id) : await supabase.from('site_settings').insert([settings])
            if (error) throw error
            notify('success', 'تم حفظ الإعدادات ✅')
        } catch (e: any) { notify('error', e.message) }
        finally { setSaving(false) }
    }

    const sections = [
        {
            title: 'النصوص الرئيسية', icon: <AlignLeft size={20} />, fields: [
                { k: 'site_title', l: 'عنوان الموقع', ph: 'كل ما تحتاجه من' },
                { k: 'site_subtitle', l: 'العنوان الملون', ph: 'معرفة وتميز' },
                { k: 'hero_description', l: 'وصف الصفحة الرئيسية', ph: 'المرجع الرقمي الأول...', ml: true },
            ]
        },
        {
            title: 'الأرقام والإحصائيات', icon: <BarChart2 size={20} />, fields: [
                { k: 'total_students', l: 'عدد الطلاب', t: 'number' },
                { k: 'total_books', l: 'عدد الكتب (للعرض)', t: 'number' },
                { k: 'total_researches', l: 'عدد الأساتذة', t: 'number' },
            ]
        },
        {
            title: 'وسائل التواصل', icon: <Globe size={20} />, fields: [
                { k: 'contact_email', l: 'البريد الإلكتروني', ph: 'info@nursing.edu.eg', ico: <Mail size={16} className="text-slate-400" /> },
                { k: 'contact_phone', l: 'رقم الهاتف', ph: '010...', ico: <Phone size={16} className="text-slate-400" /> },
                { k: 'facebook_url', l: 'رابط الفيسبوك', ph: 'https://facebook.com/...', ico: <Facebook size={16} className="text-blue-600" /> },
                { k: 'whatsapp_url', l: 'رابط الواتساب', ph: 'https://wa.me/...', ico: <MessageCircle size={16} className="text-emerald-500" /> },
            ]
        },
    ]

    return (
        <div className="max-w-3xl space-y-8">
            {sections.map((sec, si) => (
                <div key={si} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                    <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><span className="text-blue-600">{sec.icon}</span>{sec.title}</h3>
                    <div className="space-y-5">
                        {sec.fields.map((f: any) => (
                            <div key={f.k}>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    {f.ico}{f.l}
                                </label>
                                {f.ml
                                    ? <textarea value={(settings as any)[f.k] || ''} onChange={e => setSettings({ ...settings, [f.k]: e.target.value })} rows={4} placeholder={f.ph}
                                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400 resize-none" />
                                    : <input type={f.t || 'text'} value={(settings as any)[f.k] || ''} onChange={e => setSettings({ ...settings, [f.k]: f.t === 'number' ? Number(e.target.value) : e.target.value })} placeholder={f.ph}
                                        className="w-full p-4 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-400" />}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={handleSave} disabled={saving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-xl">
                {saving ? <><Loader2 className="animate-spin" size={22} /> جاري الحفظ...</> : <><Save size={22} /> حفظ كل الإعدادات</>}
            </button>
        </div>
    )
}