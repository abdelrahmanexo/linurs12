'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
    Upload, FileText, CheckCircle, AlertCircle, 
    Hash, User, Layout, ArrowRight, Sparkles, 
    ShieldCheck, Loader2, Image as ImageIcon,
    Type, ChevronDown, Globe, Book, LayoutDashboard,
    ChevronLeft
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// المحرك البرمجي لمعالجة الـ PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export default function AdminPage() {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [description, setDescription] = useState('')
    const [pageCount, setPageCount] = useState(0)
    const [type, setType] = useState('book')
    const [category, setCategory] = useState('internal')
    const [file, setFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

    // 1. وظيفة ذكية لمعالجة الملف واستخراج البيانات (خارقة)
    const processMetadata = async (pdfFile: File) => {
        try {
            const arrayBuffer = await pdfFile.arrayBuffer()
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

            // استخراج عدد الصفحات تلقائياً
            setPageCount(pdf.numPages)

            // استخراج العنوان من الميتا داتا إذا وجد
            const metadata = await pdf.getMetadata()
            if (metadata.info && (metadata.info as any).Title) {
                setTitle((metadata.info as any).Title)
            }

            return pdf;
        } catch (e) {
            console.error("Error processing PDF metadata", e)
        }
    }

    // 2. استخراج الغلاف بجودة عالية وضغط ذكي
    const extractCover = async (pdf: any): Promise<Blob> => {
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1.2 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        await page.render({ canvasContext: context!, viewport }).promise
        return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.8))
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setLoading(true)
            await processMetadata(selectedFile)
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        if (!file || !title || !author) {
            setStatus({ type: 'error', msg: 'يرجى استكمال البيانات الأساسية أولاً' })
            return
        }

        setLoading(true)
        setUploadProgress(10)

        try {
            const fileId = Math.random().toString(36).substring(7)
            const pdfData = await processMetadata(file)
            const coverBlob = await extractCover(pdfData)
            const coverFile = new File([coverBlob], `cover_${fileId}.webp`, { type: 'image/webp' })

            // أ. رفع الـ PDF مع مراقبة التقدم
            const { error: pdfError } = await supabase.storage
                .from('nursing-books')
                .upload(`pdfs/${fileId}_${file.name}`, file)
            if (pdfError) throw pdfError
            setUploadProgress(60)

            // ب. رفع الغلاف المحسن
            const { error: coverError } = await supabase.storage
                .from('nursing-books')
                .upload(`covers/cover_${fileId}.webp`, coverFile)
            if (coverError) throw coverError
            setUploadProgress(90)

            // ج. جلب الروابط وتحديث القاعدة
            const { data: { publicUrl: pdfUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`pdfs/${fileId}_${file.name}`)
            const { data: { publicUrl: coverUrl } } = supabase.storage.from('nursing-books').getPublicUrl(`covers/cover_${fileId}.webp`)

            const { error: dbError } = await supabase.from('books').insert([{
                title, author, description,
                page_count: pageCount,
                file_url: pdfUrl,
                cover_url: coverUrl,
                type, category,
            }])

            if (dbError) throw dbError

            setStatus({ type: 'success', msg: 'تمت المعالجة والنشر بنجاح عالمي! 🚀' })
            setUploadProgress(100)
        } catch (error: any) {
            setStatus({ type: 'error', msg: 'فشلت المعالجة: ' + error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-16 px-6 flex flex-col items-center relative" dir="rtl">

            {/* زر العودة */}
            <Link href="/" className="fixed top-8 right-8 z-50 flex items-center gap-2 px-6 py-3 bg-white shadow-xl rounded-2xl border border-slate-100 font-black text-slate-700 hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                <ArrowRight size={18} /> العودة للرئيسية
            </Link>

            {/* بطاقة التحكم الهجينة */}
            <div className="w-full max-w-5xl bg-white/70 backdrop-blur-3xl border border-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-10 lg:p-16 relative overflow-hidden">

                {/* زخرفة تقنية */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-200">
                            <Layout size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">نظام معالجة الأصول</h1>
                            <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Global Content Management System</p>
                        </div>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100">
                            <Loader2 className="animate-spin text-blue-600" />
                            <span className="font-black text-blue-700 text-sm">جاري التحليل الرقمي... %{uploadProgress}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    {/* الجانب الأيمن: مدخلات البيانات (Bento Style) - يأخذ 7 أعمدة */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* صف الاختيارات المزدوج */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* التخصص الأكاديمي */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mr-4">
                                    <Layout size={14} className="text-blue-600" /> التصنيف الأكاديمي
                                </label>
                                <div className="relative group">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full p-5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-[1.5rem] font-black text-slate-700 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="internal">تمريض باطني 🩺</option>
                                        <option value="critical">عناية مركزة ⚡</option>
                                        <option value="pediatric">تمريض أطفال 👶</option>
                                        <option value="psych">صحة نفسية 🧠</option>
                                        <option value="ethics">أخلاقيات مهنة 🛡️</option>
                                        <option value="community">صحة مجتمع 👥</option>
                                    </select>
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {/* نوع المرجع */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mr-4">
                                    <Type size={14} className="text-blue-600" /> نوع المرجع
                                </label>
                                <div className="relative group">
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full p-5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-[1.5rem] font-black text-slate-700 outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="book">كتاب أكاديمي 📘</option>
                                        <option value="research">بحث علمي 🎓</option>
                                    </select>
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* حقول النصوص الكبيرة */}
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="absolute -top-3 right-6 px-2 bg-white text-[10px] font-black text-blue-600 uppercase tracking-widest z-10">اسم المرجع</label>
                                <input
                                    type="text"
                                    value={title}
                                    placeholder="مثلاً: أساسيات التمريض الجراحي..."
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-6 bg-white/50 border border-slate-100 rounded-[1.5rem] font-black text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 ring-blue-500/5 transition-all shadow-sm"
                                />
                            </div>

                            <div className="relative group">
                                <label className="absolute -top-3 right-6 px-2 bg-white text-[10px] font-black text-blue-600 uppercase tracking-widest z-10">المؤلف / الدكتور</label>
                                <input
                                    type="text"
                                    value={author}
                                    placeholder="اسم الدكتور المسؤول..."
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full p-6 bg-white/50 border border-slate-100 rounded-[1.5rem] font-black text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white focus:ring-4 ring-blue-500/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* عداد الصفحات الذكي */}
                        <div className="relative overflow-hidden group">
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 text-blue-600 font-black z-10">
                                <div className="bg-blue-50 p-2 rounded-xl"><Hash size={20} /></div>
                                <span className="text-2xl">{pageCount}</span>
                                <span className="text-xs opacity-50">صفحة تم رصدها</span>
                            </div>
                            <div className="w-full p-6 pr-44 bg-blue-50/30 border border-blue-100/50 rounded-[1.8rem] font-bold text-slate-500 text-sm italic">
                                يقوم النظام بتحليل الملف واستخراج البيانات الفنية تلقائياً لضمان الدقة الأكاديمية.
                            </div>
                        </div>
                    </div>

                    {/* الجانب الأيسر: منطقة العمليات والرفع - يأخذ 5 أعمدة */}
                    <div className="lg:col-span-5 flex flex-col gap-8">

                        {/* كارت الرفع المتطور */}
                        <div className="relative group h-full min-h-[400px]">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="pdf-file"
                            />
                            <label
                                htmlFor="pdf-file"
                                className={`flex flex-col items-center justify-center w-full h-full border-4 border-dashed rounded-[3.5rem] transition-all duration-700 cursor-pointer relative overflow-hidden
                ${file
                                        ? 'border-emerald-200 bg-emerald-50/30 shadow-2xl shadow-emerald-100'
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 group-hover:shadow-2xl group-hover:shadow-blue-100'}`}
                            >
                                {file ? (
                                    <div className="flex flex-col items-center text-center px-10 animate-in zoom-in duration-500">
                                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-emerald-200 animate-bounce">
                                            <CheckCircle size={48} strokeWidth={2.5} />
                                        </div>
                                        <h4 className="font-black text-slate-800 text-xl line-clamp-2 mb-2">{file.name}</h4>
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Ready for Deployment
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center p-8">
                                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-blue-600 shadow-xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            <Upload size={40} strokeWidth={2.5} />
                                        </div>
                                        <span className="font-black text-slate-700 text-2xl mb-3 tracking-tight">إسقاط المرجع هنا</span>
                                        <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[200px]">
                                            اسحب ملف الـ PDF أو انقر لاختياره من جهازك لمعالجته رقمياً
                                        </p>
                                    </div>
                                )}

                                {/* تأثير خلفي مائي في كارت الرفع */}
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
                            </label>
                        </div>

                        {/* زر النشر الخارق */}
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className={`group relative w-full py-7 rounded-[2rem] font-black text-xl shadow-2xl transition-all overflow-hidden
            ${loading
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95 shadow-blue-900/20'}`}
                        >
                            <div className="relative z-10 flex items-center justify-center gap-4">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>جاري معالجة ونشر الأصول...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={26} className="group-hover:rotate-12 transition-transform" />
                                        <span>اعتماد ونشر المرجع الطبي</span>
                                    </>
                                )}
                            </div>

                            {/* لمعة ضوئية تمر على الزر */}
                            {!loading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            )}
                        </button>
                    </div>
                </div>

                {status && (
                    <div className={`mt-10 p-6 rounded-3xl flex items-center gap-4 font-black animate-in fade-in slide-in-from-bottom-4 duration-500 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                        {status.type === 'success' ? <CheckCircle /> : <AlertCircle />}
                        {status.msg}
                    </div>
                )}
            </div>

            {/* علامة مائية للمسؤول */}
            <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Global Academic Content Management System v4.0</p>
        </div>
    )
}