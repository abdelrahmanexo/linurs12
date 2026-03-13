'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

// === React PDF Viewer ===
import { Viewer, Worker, SpecialZoomLevel, ScrollMode, ViewMode } from '@react-pdf-viewer/core'
import { toolbarPlugin } from '@react-pdf-viewer/toolbar'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail'

// === Styles ===
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/toolbar/lib/styles/index.css'
import '@react-pdf-viewer/thumbnail/lib/styles/index.css'
import ar_AE from '@react-pdf-viewer/locales/lib/ar_AE.json'

import {
  X, ZoomIn, ZoomOut, ChevronRight, ChevronLeft,
  Maximize2, Moon, Sun, Settings, ShieldCheck,
  List, Info, FileText
} from 'lucide-react'

function PDFViewer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileUrl = searchParams.get('file')
  const title = searchParams.get('title')

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toolbarPluginInstance = toolbarPlugin()
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const thumbnailPluginInstance = thumbnailPlugin()

  const { jumpToPage } = pageNavigationPluginInstance
  const { Thumbnails } = thumbnailPluginInstance

  if (!fileUrl) return <div className="h-screen flex items-center justify-center font-black italic text-slate-400">SOURCE_NOT_FOUND</div>

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-[#f8fafc] text-slate-900'}`} dir="rtl">

      {/* 1. الهيدر الاحترافي */}
      {!isFocusMode && (
        <header className="h-[75px] flex items-center justify-between px-8 bg-white/90 backdrop-blur-md border-b border-slate-200 z-[110] relative">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
              <X size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="font-black text-sm md:text-lg truncate max-w-[200px] md:max-w-[400px] leading-tight">{title || 'المرجع العلمي'}</h1>
              <span className="text-[9px] text-blue-600 font-bold tracking-widest flex items-center gap-1 uppercase">
                <ShieldCheck size={10} /> Secure Vertical Stream
              </span>
            </div>
          </div>

          {/* وحدة التحكم المركزية بالصفحات */}
          <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => jumpToPage(currentPage - 1)} className="p-2 hover:bg-white rounded-xl text-blue-600 transition-all"><ChevronRight size={22} /></button>
            <div className="flex items-center gap-2 font-black px-4 text-xl">
              <span className="text-blue-600">{currentPage + 1}</span>
              <span className="opacity-20">/</span>
              <span className="opacity-50">{totalPages}</span>
            </div>
            <button onClick={() => jumpToPage(currentPage + 1)} className="p-2 hover:bg-white rounded-xl text-blue-600 transition-all"><ChevronLeft size={22} /></button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-3 hover:bg-slate-100 rounded-xl transition-all">
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            <button onClick={() => setIsFocusMode(true)} className="p-3 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all">
              <Maximize2 size={22} />
            </button>
          </div>
        </header>
      )}

      {/* 2. منطقة القراءة (Sidebar + Content) */}
      <div className="flex-grow relative flex overflow-hidden">

        {/* سايد بار الفهرس الذكي */}
        {!isFocusMode && (
          <aside className={`bg-white border-l border-slate-200 transition-all duration-500 flex flex-col z-[100] ${sidebarOpen ? 'w-[280px]' : 'w-0 opacity-0 overflow-hidden'}`}>
            <div className="p-5 border-b font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 flex justify-between items-center bg-slate-50">
              <span>Page Index</span>
              <FileText size={14} />
            </div>
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
              <Thumbnails />
            </div>
          </aside>
        )}

        {/* الكبسولة العائمة الجانبية */}
        {!isFocusMode && (
          <div className="absolute left-8 top-1/2 -translate-y-1/2 z-[120] flex flex-col gap-4 p-2.5 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl">
            {/* زر فتح الفهرس */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-4 rounded-3xl transition-all ${sidebarOpen ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-blue-50 text-slate-600'}`}
              title="فتح الفهرس"
            >
              <List size={24} />
            </button>

            <div className="h-px w-8 bg-slate-100 mx-auto"></div>

            {/* أدوات الزوم والبحث */}
            <toolbarPluginInstance.Toolbar>
              {(slots) => (
                <div className="flex flex-col gap-2">
                  <div className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl cursor-pointer transition-all"><slots.ZoomIn /></div>
                  <div className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl cursor-pointer transition-all"><slots.ZoomOut /></div>
                  <div className="p-3 hover:bg-blue-50 text-blue-600 rounded-xl cursor-pointer transition-all"><slots.ShowSearchPopover /></div>
                </div>
              )}
            </toolbarPluginInstance.Toolbar>
          </div>
        )}

        {/* المحتوى الرئيسي (Single Page Vertical) */}
        <main className={`flex-grow relative h-full transition-all duration-700 bg-slate-200/40 ${isFocusMode ? 'p-0' : 'p-4 md:p-8 lg:px-44'}`} dir="ltr">
          <div className={`h-full w-full bg-white transition-all duration-500 shadow-2xl relative z-[50] ${isFocusMode ? 'rounded-0' : 'rounded-[2.5rem] border border-slate-300'}`}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer
                fileUrl={fileUrl}
                plugins={[toolbarPluginInstance, pageNavigationPluginInstance, thumbnailPluginInstance]}
                localization={ar_AE as any}
                onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                onPageChange={(e) => setCurrentPage(e.currentPage)}
                initialPage={currentPage}
                defaultScale={SpecialZoomLevel.PageFit}
                // 👈 العودة للنظام الرأسي المستقر
                scrollMode={ScrollMode.Vertical}
                viewMode={ViewMode.SinglePage}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </Worker>

            {/* العلامة المائية للحماية */}
            <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] flex items-center justify-center select-none overflow-hidden">
              <h2 className="text-[12vw] font-black rotate-[-30deg] whitespace-nowrap uppercase">Nursing Digital Library</h2>
            </div>

            {/* زر العودة من الفوكس مود */}
            {isFocusMode && (
              <button onClick={() => setIsFocusMode(false)} className="absolute top-8 right-8 z-[1000] p-4 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-rose-500 transition-all shadow-2xl border border-white/10">
                <X size={26} />
              </button>
            )}
          </div>
        </main>
      </div>

      {/* 3. فوتر المعلومات */}
      {!isFocusMode && (
        <footer className="h-10 px-10 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 z-[110] relative overflow-hidden">
          {/* شريط التقدم اللحظي */}
          <div
            className="absolute top-0 right-0 h-[2px] bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          ></div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_emerald]"></div> Secure Data Tunnel</span>
            <div className="w-px h-3 bg-slate-200"></div>
            <span className="flex items-center gap-2 text-blue-500"><Info size={12} /> Vertical Reading Optimized</span>
          </div>
          <p>© Nursing RST Hub 2026</p>
        </footer>
      )}

      <style jsx global>{`
        .rpv-core__viewer { background-color: transparent !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .rpv-thumbnail__item--selected .rpv-thumbnail__image { border: 3px solid #2563eb !important; border-radius: 12px; }
        .rpv-thumbnail__image { border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  )
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-900 flex items-center justify-center text-white font-black animate-pulse">BOOTING VERTICAL ENGINE...</div>}>
      <PDFViewer />
    </Suspense>
  )
}