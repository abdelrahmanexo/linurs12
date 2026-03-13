'use client'

import React, {
  Suspense, useEffect, useState, useRef, useCallback
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'


import { Viewer, Worker, SpecialZoomLevel, ScrollMode, ViewMode } from '@react-pdf-viewer/core'
import { toolbarPlugin } from '@react-pdf-viewer/toolbar'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/toolbar/lib/styles/index.css'
import '@react-pdf-viewer/thumbnail/lib/styles/index.css'
import '@react-pdf-viewer/zoom/lib/styles/index.css'
import ar_AE from '@react-pdf-viewer/locales/lib/ar_AE.json'



import {
  X, Moon, Sun, Maximize2, ShieldCheck, FileText, BookOpen,
  StickyNote, Palette, Search,
  Bookmark, BookmarkCheck, Grid, ChevronRight, ChevronLeft, Info,
  MessageSquare, Menu, Video, Plus, Trash2, Check,
  Keyboard,
} from 'lucide-react'

type ReadMode = 'single' | 'double'
type DrawTool = 'none' | 'note'
type AppTheme = 'light' | 'dark' | 'sepia'
type SidePanel = 'thumbs' | 'bookmarks' | 'annots' | 'videos' | null
type DocType = 'pdf' | 'docx' | 'pptx' | 'md'
type FlipPhase = 'idle' | 'out' | 'in'

interface Annot { id: string; type: DrawTool; page: number; color: string; note?: string; createdAt: string }
interface VideoMarker { id: string; page: number; title: string; url: string; file_url?: string }
interface Bkmk { page: number; label: string; createdAt: string }

const COLORS = [
  { label: 'أصفر', hex: '#FCD34D', glow: '#FCD34D50' },
  { label: 'أخضر', hex: '#6EE7B7', glow: '#6EE7B750' },
  { label: 'سماوي', hex: '#67E8F9', glow: '#67E8F950' },
  { label: 'وردي', hex: '#F9A8D4', glow: '#F9A8D450' },
  { label: 'برتقالي', hex: '#FCA572', glow: '#FCA57250' },
  { label: 'بنفسجي', hex: '#C4B5FD', glow: '#C4B5FD50' },
  { label: 'أحمر', hex: '#FCA5A5', glow: '#FCA5A550' },
]

const SHORTCUTS = [
  { key: '←  →', desc: 'صفحة سابقة / تالية' },
  { key: 'F', desc: 'وضع التركيز (ملء الشاشة)' },
  { key: 'B', desc: 'إضافة / حذف إشارة مرجعية' },
  { key: 'Esc', desc: 'إلغاء / خروج' },
  { key: '?', desc: 'عرض / إخفاء هذه النافذة' },
]

const detectType = (url: string): DocType => {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  if (ext === 'md') return 'md'
  return 'pdf'
}
const sKey = (url: string, tag: string) =>
  'rdr_' + btoa(encodeURIComponent(url)).replace(/\W/g, '').slice(0, 20) + '_' + tag
const ls = {
  get: <T,>(k: string, fb: T): T => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb }
  },
  set: (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { } },
}


function Spinner() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-spin border-t-blue-500" />
        <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 animate-spin border-b-purple-400"
          style={{ animationDirection: 'reverse', animationDuration: '1.1s' }} />
      </div>
    </div>
  )
}


function DocxViewer({ url, theme }: { url: string; theme: AppTheme }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ; (async () => {
      try {
        const m = (await import('mammoth')).default
        const buf = await (await fetch(url)).arrayBuffer()
        setHtml((await m.convertToHtml({ arrayBuffer: buf })).value)
      } catch {
        setHtml('<p style="color:crimson;padding:2rem;text-align:center">فشل تحميل الملف</p>')
      } finally { setLoading(false) }
    })()
  }, [url])
  if (loading) return <Spinner />
  return (
    <div className={`docx-body p-10 max-w-4xl mx-auto leading-loose
      ${theme === 'dark' ? 'text-slate-200' : theme === 'sepia' ? 'text-[#3d2b1f]' : 'text-slate-800'}`}
      dangerouslySetInnerHTML={{ __html: html }} />
  )
}


function MdViewer({ url, theme }: { url: string; theme: AppTheme }) {
  const [nodes, setNodes] = useState<React.ReactNode[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(url).then(r => r.text()).then(t => {
      setNodes(t.split('\n').map((ln, i) => {
        if (/^### /.test(ln)) return <h3 key={i} className="text-xl font-bold mt-6 mb-2">{ln.slice(4)}</h3>
        if (/^## /.test(ln)) return <h2 key={i} className="text-2xl font-black mt-8 mb-3">{ln.slice(3)}</h2>
        if (/^# /.test(ln)) return <h1 key={i} className="text-4xl font-black mt-10 mb-4">{ln.slice(2)}</h1>
        if (/^> /.test(ln)) return <blockquote key={i} className="border-r-4 border-blue-400 pr-4 my-3 italic opacity-75">{ln.slice(2)}</blockquote>
        if (/^---/.test(ln)) return <hr key={i} className="my-6 opacity-20" />
        if (!ln) return <br key={i} />
        return <p key={i} className="my-1.5 leading-relaxed">{ln}</p>
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [url])
  if (loading) return <Spinner />
  return (
    <div className={`p-10 max-w-3xl mx-auto
      ${theme === 'dark' ? 'text-slate-200' : theme === 'sepia' ? 'text-[#3d2b1f]' : 'text-slate-800'}`}>
      {nodes}
    </div>
  )
}

function PDFScrollZoom({ children, zoomToRef, onSwipeLeft, onSwipeRight }: {
  children: React.ReactNode
  zoomToRef: React.MutableRefObject<((s: number) => void) | null>
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const zoomLvl = useRef(1)
  const panActive = useRef(false)
  const panOrigin = useRef({ mx: 0, my: 0, sl: 0, st: 0 })

  const getScroller = () => wrapRef.current?.querySelector('.rpv-core__inner-pages') as HTMLElement | null

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const next = Math.max(0.5, Math.min(6, zoomLvl.current * factor))
      zoomLvl.current = next

      zoomToRef.current?.(next)

      const scroller = getScroller()
      if (scroller) {
        el.style.cursor = next > 1.05 ? 'grab' : 'default'
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (zoomLvl.current <= 1.05 || e.button !== 0) return
      const scroller = getScroller()
      if (!scroller) return

      panActive.current = true
      panOrigin.current = {
        mx: e.clientX,
        my: e.clientY,
        sl: scroller.scrollLeft,
        st: scroller.scrollTop
      }
      el.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!panActive.current) return;
      e.preventDefault(); 
      e.stopPropagation(); 
      const scroller = getScroller();
      if (scroller) {
        scroller.scrollLeft = panOrigin.current.sl - (e.clientX - panOrigin.current.mx)
        scroller.scrollTop = panOrigin.current.st - (e.clientY - panOrigin.current.my)
      }
    }

    const onMouseUp = () => {
      panActive.current = false
      if (el) el.style.cursor = zoomLvl.current > 1.05 ? 'grab' : 'default'
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [zoomToRef])

  return <div ref={wrapRef} className="w-full h-full">{children}</div>
}


function ZoomPanWrapper({ children, onSwipeLeft, onSwipeRight, disabled }: {
  children: React.ReactNode; onSwipeLeft?: () => void; onSwipeRight?: () => void; disabled?: boolean
}) {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const lastDist = useRef(0)
  const panActive = useRef(false)
  const panOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const swipeStart = useRef({ x: 0, t: 0 })
  const scaleRef = useRef(1); scaleRef.current = scale
  const panRef = useRef({ x: 0, y: 0 }); panRef.current = pan

  const clamp = (s: number, px: number, py: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const el = ref.current; if (!el) return { x: px, y: py }
    const mx = (el.offsetWidth * (s - 1)) / 2, my = (el.offsetHeight * (s - 1)) / 2
    return { x: Math.max(-mx, Math.min(mx, px)), y: Math.max(-my, Math.min(my, py)) }
  }

  useEffect(() => {
    const el = ref.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const ns = Math.max(0.5, Math.min(5, scaleRef.current * (e.deltaY < 0 ? 1.12 : 0.9)))
      setScale(ns); if (ns <= 1.01) setPan({ x: 0, y: 0 })
    }
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2)
        lastDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      else if (e.touches.length === 1)
        swipeStart.current = { x: e.touches[0].clientX, t: Date.now() }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return; e.preventDefault()
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
      if (lastDist.current > 0) setScale(p => Math.max(0.5, Math.min(5, p * (d / lastDist.current))))
      lastDist.current = d
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        lastDist.current = 0
        if (scaleRef.current > 1.1 || disabled) return
        const dx = e.changedTouches[0].clientX - swipeStart.current.x
        const dt = Date.now() - swipeStart.current.t
        if (Math.abs(dx) > 55 && dt < 450) dx > 0 ? onSwipeRight?.() : onSwipeLeft?.()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, onSwipeLeft, onSwipeRight])

  return (
    <div ref={ref} className="w-full h-full overflow-hidden select-none"
      style={{ cursor: scale > 1.05 ? 'grab' : 'default' }}
      onMouseDown={e => {
        if (scaleRef.current <= 1.05) return
        panActive.current = true
        panOrigin.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y }
        e.preventDefault()
      }}
      onMouseMove={e => {
        if (!panActive.current) return
        setPan(clamp(scaleRef.current,
          panOrigin.current.px + (e.clientX - panOrigin.current.mx),
          panOrigin.current.py + (e.clientY - panOrigin.current.my)))
      }}
      onMouseUp={() => { panActive.current = false }}
      onMouseLeave={() => { panActive.current = false }}>
      <div className="w-full h-full origin-center"
        style={{ transform: `scale(${scale}) translate(${pan.x / scale}px,${pan.y / scale}px)`, transition: lastDist.current > 0 ? 'none' : 'transform 0.06s ease-out', willChange: 'transform' }}>
        {children}
      </div>
      {scale > 1.08 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none z-50">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}


interface PDFHostReady {
  jump: (page: number) => void
  zoomTo: (scale: number) => void
  openSearch: () => void
}

function PDFPluginHost({ fileUrl, pdfTheme, scrollMode, viewMode, showThumbs, thumbClass, onLoad, onPageChange, onReady }: {
  fileUrl: string; pdfTheme: 'dark' | 'light'; scrollMode: ScrollMode; viewMode: ViewMode
  showThumbs: boolean; thumbClass: string; onLoad: (n: number) => void
  onPageChange: (n: number) => void; onReady: (api: PDFHostReady) => void
}) {
  const toolbarPI = toolbarPlugin()
  const pageNavPI = pageNavigationPlugin()
  const thumbPI = thumbnailPlugin()
  const zoomPI = zoomPlugin()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onReady({
      jump: pageNavPI.jumpToPage,
      zoomTo: zoomPI.zoomTo,
      openSearch: () => {
        const btn = searchRef.current?.querySelector('button') as HTMLButtonElement
        btn?.click()
      },
    })
  }, []) 

  return (
    <div className="flex h-full w-full overflow-hidden">
      {showThumbs && (
        <div className={`shrink-0 overflow-y-auto custom-sb ${thumbClass}`}>
          <thumbPI.Thumbnails />
        </div>
      )}
      <div className="relative flex-grow h-full overflow-hidden">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={fileUrl} plugins={[toolbarPI, pageNavPI, thumbPI, zoomPI]}
            localization={ar_AE as any}
            onDocumentLoad={e => onLoad(e.doc.numPages)}
            onPageChange={e => onPageChange(e.currentPage)}
            defaultScale={SpecialZoomLevel.PageFit} scrollMode={scrollMode} viewMode={viewMode} theme={pdfTheme}
          />
        </Worker>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <toolbarPI.Toolbar>
            {(s) => (
              <div className="flex items-center rounded-full px-3 py-1.5 shadow-2xl border border-white/10 bg-black/70 backdrop-blur-xl gap-0.5">
                <TSlot><s.ZoomOut /></TSlot>
                <span className="text-white/70 text-[10px] font-black min-w-[2.8rem] text-center tabular-nums [&_span]:text-white/70 [&_span]:text-[10px] [&_span]:font-black">
                  <s.CurrentScale />
                </span>
                <TSlot><s.ZoomIn /></TSlot>
                <div className="w-px h-3.5 bg-white/20 mx-1" />
                <TSlot><s.ShowSearchPopover /></TSlot>
                <div className="w-px h-3.5 bg-white/20 mx-1" />
                <TSlot><s.EnterFullScreen /></TSlot>
              </div>
            )}
          </toolbarPI.Toolbar>
        </div>

        <div ref={searchRef} className="absolute -top-[9999px] pointer-events-none opacity-0 w-0 h-0 overflow-hidden">
          <toolbarPI.Toolbar>{(s) => <s.ShowSearchPopover />}</toolbarPI.Toolbar>
        </div>
      </div>
    </div>
  )
}

function TSlot({ children }: { children: React.ReactNode }) {
  return (
    <div className="[&_button]:text-white/75 [&_button]:w-8 [&_button]:h-8 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button:hover]:bg-white/15 [&_button]:transition-all [&_button]:text-sm">
      {children}
    </div>
  )
}

function IBtn({ icon, label, active, theme, onClick, activeColor, badge, disabled }: {
  icon: React.ReactNode; label: string; active?: boolean; theme: AppTheme
  onClick: () => void; activeColor?: string; badge?: number; disabled?: boolean
}) {
  const off =
    theme === 'dark' ? 'text-slate-400 hover:bg-slate-700/80 hover:text-white' :
      theme === 'sepia' ? 'text-amber-900/50 hover:bg-amber-900/10 hover:text-amber-900' :
        'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
  return (
    <button onClick={onClick} title={label} disabled={disabled}
      className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed ${active ? 'text-white shadow-lg' : off}`}
      style={active ? { backgroundColor: activeColor || '#2563eb', boxShadow: `0 4px 16px ${activeColor || '#2563eb'}55` } : {}}>
      {icon}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
function Divider({ theme }: { theme: AppTheme }) {
  return <div className={`w-6 h-px mx-auto ${theme === 'dark' ? 'bg-slate-700' : theme === 'sepia' ? 'bg-amber-400/30' : 'bg-slate-200'}`} />
}

function ReaderApp() {
  const params = useSearchParams()
  const router = useRouter()
  const fileUrl = params.get('file') || ''
  const title = params.get('title') || 'المرجع العلمي'
  const docType = (params.get('type') as DocType | null) || detectType(fileUrl)

  const [signedUrl, setSignedUrl] = useState('')
  useEffect(() => {
    if (!fileUrl) return
    if (fileUrl.includes('supabase.co/storage')) {
      const m = fileUrl.match(/nursing-books\/(.+?)(\?|$)/)
      if (m) {
        supabase.storage.from('nursing-books').createSignedUrl(decodeURIComponent(m[1]), 3600)
          .then(({ data, error }) => {
            if (data?.signedUrl) setSignedUrl(data.signedUrl)
            else console.error(error)
          })
      }
    } else { setSignedUrl(fileUrl) }
  }, [fileUrl])

  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [theme, setTheme] = useState<AppTheme>('light')
  const [focusMode, setFocusMode] = useState(false)
  const [panel, setPanel] = useState<SidePanel>(null)
  const [mobileMenu, setMobile] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const [editPage, setEditPage] = useState(false)
  const [pageInput, setPageInput] = useState('')

  const [tool, setTool] = useState<DrawTool>('none')
  const [color, setColor] = useState(COLORS[0].hex)
  const [colorOpen, setColorOpen] = useState(false)
  const [annots, setAnnots] = useState<Annot[]>([])
  const [noteText, setNoteText] = useState('')
  const [noteLabel, setNoteLabel] = useState('')
  const [noteOpen, setNoteOpen] = useState(false)

  const [videos, setVideos] = useState<VideoMarker[]>([])
  const [vForm, setVForm] = useState({ title: '', url: '' })
  const [addingVid, setAddingVid] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  const [isAdmin, setIsAdmin] = useState(false)

  const [bookmarks, setBookmarks] = useState<Bkmk[]>([])
  const [bkmkLabel, setBkmkLabel] = useState('')
  const [bkmkOpen, setBkmkOpen] = useState(false)

  const [flipPhase, setFlipPhase] = useState<FlipPhase>('idle')
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next')
  const flipLock = useRef(false)

  const jumpRef = useRef<((p: number) => void) | null>(null)
  const zoomToRef = useRef<((s: number) => void) | null>(null)
  const searchRef = useRef<(() => void) | null>(null)
  const jump = (p: number) => jumpRef.current?.(p)

  const isBookmarked = bookmarks.some(b => b.page === page)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!fileUrl) return
    setAnnots(ls.get<Annot[]>(sKey(fileUrl, 'annots'), []))
    supabase
      .from('video_markers')
      .select('*')
      .eq('file_url', fileUrl)
      .then(({ data }) => { if (data) setVideos(data) })


    setBookmarks(ls.get<Bkmk[]>(sKey(fileUrl, 'bkmks'), []))
    const lp = ls.get<number>(sKey(fileUrl, 'page'), 0)
    if (lp > 0) setTimeout(() => jump(lp), 900)
  }, [fileUrl])
  useEffect(() => { if (fileUrl) ls.set(sKey(fileUrl, 'annots'), annots) }, [annots, fileUrl])

  useEffect(() => { if (fileUrl) ls.set(sKey(fileUrl, 'bkmks'), bookmarks) }, [bookmarks, fileUrl])
  useEffect(() => { if (fileUrl && total > 0) ls.set(sKey(fileUrl, 'page'), page) }, [page, fileUrl, total])

  const doFlip = useCallback((dir: 'next' | 'prev') => {
    if (flipLock.current) return
    const t = dir === 'next' ? page + 1 : page - 1
    if (t < 0 || (total > 0 && t >= total)) return
    flipLock.current = true; setFlipDir(dir); setFlipPhase('out')
    setTimeout(() => {
      jump(t); setFlipPhase('in')
      setTimeout(() => { setFlipPhase('idle'); flipLock.current = false }, 280)
    }, 280)
  }, [page, total])

  const toggleBookmark = useCallback(() => {
    if (isBookmarked) { setBookmarks(prev => prev.filter(b => b.page !== page)) }
    else { setBkmkLabel(`صفحة ${page + 1}`); setBkmkOpen(true) }
  }, [isBookmarked, page])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') doFlip('next')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') doFlip('prev')
      if (e.key === 'Escape') { setFocusMode(false); setTool('none'); setColorOpen(false); setPanel(null); setShortcuts(false) }
      if (e.key === 'f' && !e.ctrlKey) setFocusMode(v => !v)
      if (e.key === 'b') toggleBookmark()
      if (e.key === '?') setShortcuts(v => !v)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [page, doFlip, toggleBookmark])

  const addAnnot = (type: DrawTool, note?: string) =>
    setAnnots(prev => [...prev, { id: Math.random().toString(36).slice(2), type, page, color, note, createdAt: new Date().toLocaleString('ar-EG') }])
  const addVideo = async () => {
    if (!vForm.url.trim() || !isAdmin) return
    const newVideo = {
      file_url: fileUrl,
      page,
      title: vForm.title || `فيديو ص${page + 1}`,
      url: vForm.url,
    }
    const { data, error } = await supabase
      .from('video_markers')
      .insert([newVideo])
      .select()
      .single()
    if (!error && data) {
      setVideos(prev => [...prev, data])
      setVForm({ title: '', url: '' })
      setAddingVid(false)
    }
  }

  const deleteVideo = async (id: string) => {
    if (!isAdmin) return
    await supabase.from('video_markers').delete().eq('id', id)
    setVideos(prev => prev.filter(v => v.id !== id))
  }
  const toEmbed = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/)
    return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url
  }

  const T = {
    root: { light: 'bg-slate-100', dark: 'bg-[#0d1117]', sepia: 'bg-[#f0e6c8]' }[theme],
    header: { light: 'bg-white/97 border-slate-200/80', dark: 'bg-[#161b22]/97 border-slate-700/50', sepia: 'bg-[#ede0be]/97 border-amber-400/40' }[theme],
    panel: { light: 'bg-white border-slate-200', dark: 'bg-[#161b22] border-slate-700', sepia: 'bg-[#ede0be] border-amber-300/60' }[theme],
    pill: { light: 'bg-white/97 border-slate-200 shadow-slate-300/50', dark: 'bg-[#1c2128]/97 border-slate-700/70 shadow-black/40', sepia: 'bg-[#e8d5a3]/97 border-amber-300/50 shadow-amber-900/10' }[theme],
    viewer: { light: 'bg-white', dark: 'bg-[#0d1117]', sepia: 'bg-[#f5e8cc]' }[theme],
    footer: { light: 'bg-white border-slate-200 text-slate-400', dark: 'bg-[#161b22] border-slate-700 text-slate-500', sepia: 'bg-[#ede0be] border-amber-300/50 text-amber-800/50' }[theme],
    txt: { light: 'text-slate-800', dark: 'text-slate-100', sepia: 'text-[#3d2b1f]' }[theme],
    sub: { light: 'text-slate-500', dark: 'text-slate-400', sepia: 'text-amber-900/60' }[theme],
    input: { light: 'bg-slate-100 border-slate-200 text-slate-800', dark: 'bg-slate-800 border-slate-700 text-slate-100', sepia: 'bg-amber-50 border-amber-300 text-amber-900' }[theme],
    badge: { light: 'bg-slate-100 border-slate-200', dark: 'bg-slate-800 border-slate-700', sepia: 'bg-amber-100/70 border-amber-300/60' }[theme],
    row: { light: 'hover:bg-slate-50', dark: 'hover:bg-slate-800/60', sepia: 'hover:bg-amber-50/60' }[theme],
    ph: { light: 'bg-slate-50 border-slate-100', dark: 'bg-[#1c2128] border-slate-700', sepia: 'bg-amber-50/50 border-amber-200/60' }[theme],
  }

  const flipStyle = (() => {
    const ox = flipDir === 'next' ? '0%' : '100%'
    if (flipPhase === 'idle') return { transform: 'rotateY(0deg)', transformOrigin: `${ox} 50%` }
    if (flipPhase === 'out') return { transform: flipDir === 'next' ? 'rotateY(-92deg) scale(0.95)' : 'rotateY(92deg) scale(0.95)', transformOrigin: `${ox} 50%` }
    return { transform: 'rotateY(0deg)', transformOrigin: `${ox} 50%` }
  })()

  const progress = total > 0 ? Math.round(((page + 1) / total) * 100) : 0
  const pageVideos = videos.filter(v => v.page === page)

  if (!fileUrl) return (
    <div className="h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 text-white">
      <FileText size={60} className="opacity-15" />
      <h2 className="text-2xl font-black opacity-40">لا يوجد ملف</h2>
    </div>
  )
  if (!signedUrl) return (
    <div className="h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 animate-spin border-t-blue-500" />
        <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 animate-spin border-b-purple-400" style={{ animationDirection: 'reverse', animationDuration: '1.3s' }} />
      </div>
      <p className="text-slate-500 text-sm font-bold">جاري تحميل الملف...</p>
    </div>
  )

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${T.root} ${T.txt}`} dir="rtl">

      {!focusMode && (
        <header className={`shrink-0 z-[300] flex items-center justify-between px-3 md:px-5 h-14 backdrop-blur-xl border-b transition-colors ${T.header}`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button onClick={() => router.back()}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-xl shadow-md shadow-rose-500/30 transition-all">
              <X size={14} />
            </button>
            <div className="min-w-0 hidden sm:block">
              <h1 className={`font-black text-sm truncate max-w-[140px] md:max-w-[360px] ${T.txt}`}>{title}</h1>
              <div className="flex items-center gap-1.5 mt-px">
                <span className="text-[8px] font-black tracking-[.15em] uppercase text-blue-500 flex items-center gap-1"><ShieldCheck size={8} /> Secure</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${T.badge} ${docType === 'pdf' ? 'text-rose-500' : docType === 'docx' ? 'text-blue-500' : docType === 'pptx' ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {docType.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-2xl border ${T.badge}`}>
            <button onClick={() => doFlip('prev')} disabled={page === 0}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-600'}`}>
              <ChevronRight size={15} />
            </button>
            {editPage ? (
              <input autoFocus type="number" value={pageInput} onChange={e => setPageInput(e.target.value)}
                onBlur={() => { const p = +pageInput - 1; if (!isNaN(p) && p >= 0 && p < total) jump(p); setEditPage(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { const p = +pageInput - 1; if (!isNaN(p)) jump(p); setEditPage(false) } if (e.key === 'Escape') setEditPage(false) }}
                className={`w-10 text-center text-sm font-black rounded-lg border px-1 py-0.5 outline-none focus:ring-2 ring-blue-500 ${T.input}`} />
            ) : (
              <button onClick={() => { setPageInput(String(page + 1)); setEditPage(true) }}
                className="flex items-center gap-1 px-2 font-black text-sm hover:opacity-60 transition-all">
                <span className="text-blue-500">{page + 1}</span>
                <span className="opacity-20">/</span>
                <span className={`text-xs ${T.sub}`}>{total || '–'}</span>
              </button>
            )}
            <button onClick={() => doFlip('next')} disabled={total > 0 && page >= total - 1}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 ${theme === 'dark' ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-slate-100 text-blue-600'}`}>
              <ChevronLeft size={15} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 flex-1 justify-end">
            <button onClick={toggleBookmark} title={isBookmarked ? 'حذف الإشارة (B)' : 'إضافة إشارة (B)'}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isBookmarked ? 'text-amber-500' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>

            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'sepia' : 'light')} title="تغيير المظهر"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              {theme === 'light' ? <Moon size={15} /> : theme === 'dark' ? <Sun size={15} /> : <Palette size={15} />}
            </button>
            <button onClick={() => setFocusMode(true)} title="ملء الشاشة (F)"
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
              <Maximize2 size={15} />
            </button>

            <button onClick={() => setMobile(!mobileMenu)}
              className={`md:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              <Menu size={15} />
            </button>
          </div>
        </header>
      )}

      <div className="flex-grow relative flex overflow-hidden">

        {!focusMode && (
          <div className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-0.5 p-1.5 rounded-[1.6rem] border shadow-2xl backdrop-blur-2xl ${T.pill}`}>
            <IBtn icon={<MessageSquare size={16} />} label="إضافة ملاحظة" theme={theme} active={tool === 'note'} activeColor="#7c3aed" onClick={() => { setTool('note'); setNoteOpen(true) }} />

          </div>
        )}

        {!focusMode && (
          <div className={`absolute left-1.5 md:left-2.5 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-0.5 p-1.5 rounded-[1.6rem] border shadow-2xl backdrop-blur-2xl ${T.pill}`}>
            <IBtn icon={<Grid size={16} />} label="صور مصغرة" theme={theme} active={panel === 'thumbs'} onClick={() => setPanel(p => p === 'thumbs' ? null : 'thumbs')} />
            <IBtn icon={<BookmarkCheck size={16} />} label="الإشارات المرجعية" theme={theme} active={panel === 'bookmarks'} badge={bookmarks.length} onClick={() => setPanel(p => p === 'bookmarks' ? null : 'bookmarks')} />
            <IBtn icon={<StickyNote size={16} />} label="الملاحظات" theme={theme} active={panel === 'annots'} badge={annots.length} onClick={() => setPanel(p => p === 'annots' ? null : 'annots')} />
            <IBtn icon={<Video size={16} />} label="فيديوهات" theme={theme} active={panel === 'videos'} badge={pageVideos.length} onClick={() => setPanel(p => p === 'videos' ? null : 'videos')} />
          </div>
        )}

        {!focusMode && panel && (
          <aside className={`shrink-0 w-[250px] md:w-[270px] border-l z-[150] flex flex-col overflow-hidden ${T.panel}`}>
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] shrink-0 ${T.sub} ${T.ph}`}>
              <span>{{ thumbs: 'الصفحات', bookmarks: 'الإشارات', annots: 'الملاحظات', videos: 'فيديوهات' }[panel]}</span>
              <button onClick={() => setPanel(null)} className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} transition-all`}><X size={12} /></button>
            </div>
            <div className="flex-grow overflow-y-auto custom-sb p-2.5">

              {panel === 'thumbs' && (
                <div className="flex flex-col gap-2">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${T.sub}`}>انتقال سريع للصفحات</p>
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: Math.min(total || 40, 40) }).map((_, i) => (
                      <button key={i} onClick={() => jump(i)}
                        className={`h-8 text-[10px] font-black rounded-lg transition-all border
                          ${page === i ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                            : bookmarks.some(b => b.page === i) ? `border-amber-400 text-amber-500 ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'}`
                              : `${T.badge} ${T.sub} ${T.row}`}`}>
                        {i + 1}
                      </button>
                    ))}
                    {(total || 0) > 40 && <p className={`col-span-4 text-[9px] text-center py-1 ${T.sub} opacity-50`}>و {total - 40} أخرى…</p>}
                  </div>
                  <p className={`text-[9px] mt-2 ${T.sub} opacity-60 text-center leading-relaxed`}>
                    🟡 = إشارات مرجعية &nbsp;|&nbsp; 🔵 = الصفحة الحالية
                  </p>
                </div>
              )}

              {panel === 'bookmarks' && (
                <div className="flex flex-col gap-1.5">
                  {bookmarks.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <Bookmark size={32} className="opacity-15" />
                      <p className={`text-xs font-bold ${T.sub}`}>لا توجد إشارات</p>
                      <p className={`text-[10px] ${T.sub} opacity-60 text-center leading-relaxed`}>اضغط النجمة في الهيدر أو <kbd className="px-1 py-0.5 rounded border text-[9px]">B</kbd></p>
                    </div>
                  ) : [...bookmarks].sort((a, b) => a.page - b.page).map(bk => (
                    <div key={bk.page}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${T.row} ${T.panel} ${bk.page === page ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                      onClick={() => jump(bk.page)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookmarkCheck size={12} className="text-amber-500 shrink-0" />
                          <span className={`font-black text-[11px] ${T.txt}`}>{bk.label}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setBookmarks(prev => prev.filter(b => b.page !== bk.page)) }}
                          className="p-0.5 rounded hover:text-rose-500 opacity-40 hover:opacity-100 transition-all"><Trash2 size={10} /></button>
                      </div>
                      <p className={`text-[9px] mt-0.5 ${T.sub}`}>{bk.createdAt}</p>
                    </div>
                  ))}
                  <button onClick={toggleBookmark}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed text-[10px] font-black text-amber-500 hover:bg-amber-500/5 transition-all mt-1">
                    <Plus size={12} /> {isBookmarked ? 'حذف إشارة هذه الصفحة' : `إضافة صفحة ${page + 1}`}
                  </button>
                  {bookmarks.length > 0 && (
                    <button onClick={() => setBookmarks([])} className="text-[10px] font-black text-rose-500 hover:text-rose-600 text-center py-1">مسح الكل</button>
                  )}
                </div>
              )}

              {panel === 'annots' && (
                <div className="flex flex-col gap-1.5">
                  {annots.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <StickyNote size={32} className="opacity-15" />
                      <p className={`text-xs font-bold ${T.sub}`}>لا توجد ملاحظات</p>
                      <p className={`text-[10px] ${T.sub} opacity-60`}>استخدم زر الملاحظة في الشريط الجانبي</p>
                    </div>
                  ) : [...annots].reverse().map(a => (
                    <div key={a.id}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${T.row} ${T.panel}`}
                      onClick={() => jump(a.page)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color, boxShadow: `0 0 5px ${a.color}` }} />
                          <span className={`font-black text-[10px] ${T.sub}`}>ص {a.page + 1}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setAnnots(prev => prev.filter(x => x.id !== a.id)) }}
                          className="p-0.5 rounded hover:text-rose-500 opacity-40 hover:opacity-100 transition-all"><Trash2 size={10} /></button>
                      </div>
                      <div className={`flex items-center gap-1 ${T.sub} opacity-60`}>
                        <StickyNote size={9} />
                        <span className="font-bold text-[10px]">ملاحظة</span>
                      </div>
                      {a.note && <p className={`mt-1.5 text-[11px] leading-relaxed p-2 rounded-lg ${T.ph} border`}>{a.note}</p>}
                    </div>
                  ))}
                  {annots.length > 0 && <button onClick={() => setAnnots([])} className="mt-1 text-[10px] font-black text-rose-500 text-center py-1">مسح الكل</button>}
                </div>
              )}

              {panel === 'videos' && (
                <div className="flex flex-col gap-2">

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">وضع الأدمن</span>
                    </div>
                  )}

                  <p className={`text-[9px] font-black uppercase tracking-widest ${T.sub}`}>فيديوهات صفحة {page + 1}</p>

                  {videos.filter(v => v.page === page).map(v => (
                    <div key={v.id} className={`p-2.5 rounded-xl border text-xs ${T.panel}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-black text-[11px] ${T.txt}`}>{v.title}</span>
                        {isAdmin && (
                          <button
                            onClick={() => deleteVideo(v.id)}
                            className="p-0.5 rounded hover:text-rose-500 opacity-40 hover:opacity-100 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:text-blue-400 text-[10px] truncate block"
                      >
                        {v.url}
                      </a>
                    </div>
                  ))}

                  {videos.filter(v => v.page === page).length === 0 && !addingVid && (
                    <p className={`text-[10px] ${T.sub} text-center py-3`}>لا توجد فيديوهات لهذه الصفحة</p>
                  )}

                  {isAdmin && (
                    addingVid ? (
                      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${T.panel}`}>
                        <input
                          value={vForm.title}
                          onChange={e => setVForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="عنوان الفيديو"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 ring-blue-500 ${T.input}`}
                        />
                        <input
                          value={vForm.url}
                          onChange={e => setVForm(f => ({ ...f, url: e.target.value }))}
                          placeholder="رابط الفيديو *"
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 ring-blue-500 ${T.input}`}
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={addVideo}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700"
                          >
                            إضافة
                          </button>
                          <button
                            onClick={() => setAddingVid(false)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border ${T.badge}`}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingVid(true)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed text-[10px] font-black text-blue-500 hover:bg-blue-500/5 transition-all"
                      >
                        <Plus size={12} /> ربط فيديو بهذه الصفحة
                      </button>
                    )
                  )}

                  {videos.length > 0 && (
                    <>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${T.sub}`}>
                        كل الفيديوهات ({videos.length})
                      </p>
                      {videos.map(v => (
                        <div
                          key={v.id}
                          className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer ${T.row} ${T.panel}`}
                          onClick={() => jump(v.page)}
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Video size={11} className="text-blue-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`font-black text-[10px] truncate ${T.txt}`}>{v.title}</p>
                            <p className={`text-[9px] ${T.sub}`}>ص {v.page + 1}</p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); deleteVideo(v.id) }}
                              className="p-0.5 rounded hover:text-rose-500 opacity-30 hover:opacity-100 transition-all shrink-0"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {activeVideo && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setActiveVideo(null)}>
            <div className="relative w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
              <button onClick={() => setActiveVideo(null)}
                className="absolute -top-10 left-0 flex items-center gap-2 text-white/70 hover:text-white font-black text-xs transition-all">
                <X size={16} /> إغلاق
              </button>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={toEmbed(activeVideo)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
        {noteOpen && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setNoteOpen(false); setTool('none') }}>
            <div className={`relative w-80 rounded-3xl border p-5 shadow-2xl ${T.panel}`} onClick={e => e.stopPropagation()}>
              <h3 className={`font-black text-sm mb-1 ${T.txt}`}>ملاحظة — صفحة {page + 1}</h3>
              <input value={noteLabel} onChange={e => setNoteLabel(e.target.value)} placeholder="عنوان (اختياري)"
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 ring-purple-400 mb-2 ${T.input}`} />
              <textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="اكتب ملاحظتك..."
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-purple-500 resize-none ${T.input}`} />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={() => { setNoteOpen(false); setNoteText(''); setNoteLabel(''); setTool('none') }}
                  className={`px-4 py-2 rounded-xl text-xs font-black border ${T.badge}`}>إلغاء</button>
                <button onClick={() => {
                  addAnnot('note', [noteLabel, noteText].filter(Boolean).join(': ') || '(ملاحظة)')
                  setNoteOpen(false); setNoteText(''); setNoteLabel(''); setTool('none')
                }} className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/30">حفظ</button>
              </div>
            </div>
          </div>
        )}

        {bkmkOpen && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setBkmkOpen(false)}>
            <div className={`relative w-72 rounded-3xl border p-5 shadow-2xl ${T.panel}`} onClick={e => e.stopPropagation()}>
              <h3 className={`font-black text-sm mb-3 ${T.txt}`}>إشارة مرجعية — ص {page + 1}</h3>
              <input autoFocus value={bkmkLabel} onChange={e => setBkmkLabel(e.target.value)} placeholder={`صفحة ${page + 1}`}
                onKeyDown={e => { if (e.key === 'Enter') { setBookmarks(prev => [...prev, { page, label: bkmkLabel || `صفحة ${page + 1}`, createdAt: new Date().toLocaleString('ar-EG') }]); setBkmkOpen(false) } if (e.key === 'Escape') setBkmkOpen(false) }}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-amber-500 ${T.input}`} />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={() => setBkmkOpen(false)} className={`px-4 py-2 rounded-xl text-xs font-black border ${T.badge}`}>إلغاء</button>
                <button onClick={() => { setBookmarks(prev => [...prev, { page, label: bkmkLabel || `صفحة ${page + 1}`, createdAt: new Date().toLocaleString('ar-EG') }]); setBkmkOpen(false) }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/30">حفظ</button>
              </div>
            </div>
          </div>
        )}

        {shortcuts && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShortcuts(false)}>
            <div className={`relative w-80 rounded-3xl border p-5 shadow-2xl ${T.panel}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-black text-sm ${T.txt}`}>اختصارات لوحة المفاتيح</h3>
                <button onClick={() => setShortcuts(false)} className={`p-1.5 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><X size={14} /></button>
              </div>
              <div className="flex flex-col gap-2.5">
                {SHORTCUTS.map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className={`text-[11px] ${T.sub}`}>{desc}</span>
                    <kbd className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-lg border ${T.badge} ${T.txt}`}>{key}</kbd>
                  </div>
                ))}
              </div>
              <p className={`text-[9px] text-center mt-4 ${T.sub} opacity-40`}>اضغط Esc أو ? للإغلاق</p>
            </div>
          </div>
        )}

        <main className={`flex-grow relative h-full overflow-hidden transition-all ${focusMode ? '' : 'p-2.5 md:p-4 pr-14 pl-14 md:pr-16 md:pl-16'} ${T.root}`} dir="ltr">

          {pageVideos.length > 0 && !focusMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[150] flex gap-2 flex-wrap justify-center">
              {pageVideos.map(v => (
                <button key={v.id} onClick={() => setActiveVideo(v.url)}
                  className="flex items-center gap-1.5 bg-black/70 text-white text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 hover:bg-red-600 transition-all shadow-xl">
                  <Video size={11} className="text-red-400" /> {v.title}
                </button>
              ))}
            </div>
          )}

          <div className={`h-full w-full relative overflow-hidden transition-all duration-300
            ${focusMode ? '' : `rounded-2xl md:rounded-3xl shadow-2xl border ${theme === 'dark' ? 'border-slate-700/70' : theme === 'sepia' ? 'border-amber-300/40' : 'border-slate-200/80'}`}
            ${T.viewer}`}
            style={{ perspective: '2400px' }}>

            <div className="w-full h-full" style={flipPhase === 'idle' ? { transform: 'none' } : { ...flipStyle, transition: 'transform 0.28s ease' }}>

              {docType === 'pdf' && (
                <PDFScrollZoom zoomToRef={zoomToRef} onSwipeLeft={() => doFlip('next')} onSwipeRight={() => doFlip('prev')}>
                  <PDFPluginHost
                    fileUrl={signedUrl} pdfTheme={theme === 'dark' ? 'dark' : 'light'}
                    scrollMode={ScrollMode.Page} viewMode={ViewMode.SinglePage}
                    showThumbs={panel === 'thumbs'} thumbClass={`w-[190px] border-r ${T.panel.split(' ').slice(0, 2).join(' ')}`}
                    onLoad={n => setTotal(n)} onPageChange={n => setPage(n)}
                    onReady={api => { jumpRef.current = api.jump; zoomToRef.current = api.zoomTo; searchRef.current = api.openSearch }}
                  />
                </PDFScrollZoom>
              )}

              {(docType === 'docx' || docType === 'md') && (
                <ZoomPanWrapper onSwipeLeft={() => doFlip('next')} onSwipeRight={() => doFlip('prev')} disabled={flipPhase !== 'idle'}>
                  {docType === 'docx' && <div className="h-full overflow-y-auto custom-sb"><DocxViewer url={signedUrl} theme={theme} /></div>}
                  {docType === 'md' && <div className="h-full overflow-y-auto custom-sb"><MdViewer url={signedUrl} theme={theme} /></div>}
                </ZoomPanWrapper>
              )}

              {docType === 'pptx' && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`}
                  className="w-full h-full border-none" title="عرض تقديمي" />
              )}
            </div>

            <div className="absolute inset-0 pointer-events-none z-[30] opacity-[0.016] flex items-center justify-center overflow-hidden select-none">
              <span className="text-[9vw] font-black rotate-[-25deg] whitespace-nowrap uppercase tracking-[.3em]">Nursing Digital Library</span>
            </div>

            {focusMode && (
              <button onClick={() => setFocusMode(false)}
                className="absolute top-5 right-5 z-[1000] w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-xl text-white rounded-full hover:bg-rose-500 transition-all shadow-2xl border border-white/10">
                <X size={18} />
              </button>
            )}

            {docType === 'pdf' && flipPhase === 'idle' && (
              <>
                <button onClick={() => doFlip('prev')} disabled={page === 0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md hover:bg-black/25 rounded-full transition-all disabled:opacity-0 border border-white/10 shadow-lg">
                  <ChevronRight size={22} className={T.txt} />
                </button>
                <button onClick={() => doFlip('next')} disabled={total > 0 && page >= total - 1}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md hover:bg-black/25 rounded-full transition-all disabled:opacity-0 border border-white/10 shadow-lg">
                  <ChevronLeft size={22} className={T.txt} />
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {!focusMode && (
        <footer className={`shrink-0 h-8 px-5 flex items-center justify-between text-[8px] font-black uppercase tracking-[.12em] z-[300] relative overflow-hidden border-t ${T.footer}`}>
          <div className="absolute top-0 right-0 h-[2px] transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(to left,#2563eb,#7c3aed)' }} />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Secure</span>
            {bookmarks.length > 0 && <span className="flex items-center gap-1 text-amber-500"><Bookmark size={8} /> {bookmarks.length}</span>}
            {tool !== 'none' && (
              <span className="flex items-center gap-1 animate-pulse">
                <StickyNote size={8} className="text-purple-400" />
                <span className="text-purple-400">ملاحظة</span>
              </span>
            )}
            <span className={`hidden md:flex items-center gap-1 ${theme === 'dark' ? 'text-blue-400' : theme === 'sepia' ? 'text-amber-700' : 'text-blue-500'}`}>
              <Info size={9} /> {progress}% — {page + 1} / {total || '?'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden md:block ${T.sub} opacity-40 normal-case tracking-normal font-medium`}>? للاختصارات</span>
            <p>© Nursing RST Hub 2026</p>
          </div>
        </footer>
      )}

      <style jsx global>{`
        .rpv-core__viewer,.rpv-core__inner-container{background:transparent!important}
        .custom-sb::-webkit-scrollbar{width:3px;height:3px}
        .custom-sb::-webkit-scrollbar-track{background:transparent}
        .custom-sb::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:99px}
        .rpv-thumbnail__item--selected .rpv-thumbnail__image{border:2px solid #2563eb!important;border-radius:8px;box-shadow:0 0 10px #2563eb40}
        .rpv-thumbnail__image{border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.12);transition:all .2s}
        .rpv-thumbnail__item:hover .rpv-thumbnail__image{transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.2)}
        .docx-body p{margin-bottom:.7em}.docx-body h1{font-size:2em;font-weight:900;margin:1em 0 .4em}
        .docx-body h2{font-size:1.5em;font-weight:800;margin:.8em 0 .35em}.docx-body h3{font-size:1.2em;font-weight:700;margin:.7em 0 .3em}
        .docx-body table{border-collapse:collapse;width:100%;margin:1em 0}.docx-body td,.docx-body th{border:1px solid #e2e8f0;padding:7px 11px}
        .docx-body th{background:#f8fafc;font-weight:700}.docx-body img{max-width:100%;border-radius:8px}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  )
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 animate-spin border-t-blue-500" />
          <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 animate-spin border-b-purple-400" style={{ animationDirection: 'reverse', animationDuration: '1.3s' }} />
          <div className="absolute inset-4 rounded-full border-2 border-cyan-400/20 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-black text-2xl tracking-[.25em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Loading Reader</p>
          <p className="text-slate-600 text-[9px] mt-1.5 tracking-[.3em] uppercase">Nursing RST Hub</p>
        </div>
      </div>
    }>
      <ReaderApp />
    </Suspense>
  )
}