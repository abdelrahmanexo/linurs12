'use client'

import React, {
  Suspense, useEffect, useState, useRef, useCallback
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── PDF Viewer ────────────────────────────────────────────────────
import { Viewer, Worker, SpecialZoomLevel, ScrollMode, ViewMode } from '@react-pdf-viewer/core'
import { toolbarPlugin }        from '@react-pdf-viewer/toolbar'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { thumbnailPlugin }      from '@react-pdf-viewer/thumbnail'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/toolbar/lib/styles/index.css'
import '@react-pdf-viewer/thumbnail/lib/styles/index.css'
import ar_AE from '@react-pdf-viewer/locales/lib/ar_AE.json'


// ─── Icons ─────────────────────────────────────────────────────────
import {
  X, Moon, Sun, Maximize2, ShieldCheck, FileText, BookOpen, Columns,
  Highlighter, Pen, StickyNote, Underline, Eraser, Palette, Search,
  Bookmark, Grid, ChevronRight, ChevronLeft, Info, MessageSquare,
  Menu, Video, Plus, Trash2, Type, Check
} from 'lucide-react'

// ══════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════

type ReadMode  = 'single' | 'double'
type DrawTool  = 'none' | 'highlight' | 'underline' | 'pen' | 'note' | 'eraser'
type AppTheme  = 'light' | 'dark' | 'sepia'
type SidePanel = 'thumbs' | 'annots' | 'search' | 'videos' | null
type DocType   = 'pdf' | 'docx' | 'pptx' | 'md'
type FlipPhase = 'idle' | 'out' | 'in'

interface Annot {
  id: string; type: DrawTool; page: number
  color: string; note?: string; createdAt: string
}
interface VideoMarker {
  id: string; page: number; title: string; url: string
}

// ══════════════════════════════════════════════════════════════════════
// CONSTANTS & UTILS
// ══════════════════════════════════════════════════════════════════════

const COLORS = [
  { label: 'أصفر',    hex: '#FCD34D', glow: '#FCD34D50' },
  { label: 'أخضر',    hex: '#6EE7B7', glow: '#6EE7B750' },
  { label: 'سماوي',   hex: '#67E8F9', glow: '#67E8F950' },
  { label: 'وردي',    hex: '#F9A8D4', glow: '#F9A8D450' },
  { label: 'برتقالي', hex: '#FCA572', glow: '#FCA57250' },
  { label: 'بنفسجي',  hex: '#C4B5FD', glow: '#C4B5FD50' },
  { label: 'أحمر',    hex: '#FCA5A5', glow: '#FCA5A550' },
]

const detectType = (url: string): DocType => {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  if (ext === 'md')                    return 'md'
  return 'pdf'
}

const sKey = (url: string, tag: string) =>
  'rdr_' + btoa(encodeURIComponent(url)).replace(/\W/g, '').slice(0, 20) + '_' + tag

const ls = {
  get: <T,>(key: string, fb: T): T => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} },
}

// ══════════════════════════════════════════════════════════════════════
// SUB-VIEWERS
// ══════════════════════════════════════════════════════════════════════

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
  const [html, setHtml]       = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    ;(async () => {
      try {
        const m   = (await import('mammoth')).default
        const buf = await (await fetch(url)).arrayBuffer()
        setHtml((await m.convertToHtml({ arrayBuffer: buf })).value)
      } catch {
        setHtml('<p style="color:crimson;padding:2rem;text-align:center">فشل تحميل الملف</p>')
      } finally { setLoading(false) }
    })()
  }, [url])
  if (loading) return <Spinner />
  return (
    <div className={`docx-body p-10 max-w-4xl mx-auto leading-loose ${
      theme === 'dark' ? 'text-slate-200' : theme === 'sepia' ? 'text-[#3d2b1f]' : 'text-slate-800'
    }`} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function MdViewer({ url, theme }: { url: string; theme: AppTheme }) {
  const [nodes, setNodes]     = useState<React.ReactNode[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(url).then(r => r.text()).then(t => {
      setNodes(t.split('\n').map((ln, i) => {
        if (/^### /.test(ln)) return <h3 key={i} className="text-xl font-bold mt-6 mb-2">{ln.slice(4)}</h3>
        if (/^## /.test(ln))  return <h2 key={i} className="text-2xl font-black mt-8 mb-3">{ln.slice(3)}</h2>
        if (/^# /.test(ln))   return <h1 key={i} className="text-4xl font-black mt-10 mb-4">{ln.slice(2)}</h1>
        if (/^> /.test(ln))   return <blockquote key={i} className="border-r-4 border-blue-400 pr-4 my-3 italic opacity-75">{ln.slice(2)}</blockquote>
        if (/^---/.test(ln))  return <hr key={i} className="my-6 opacity-20" />
        if (!ln)              return <br key={i} />
        return <p key={i} className="my-1.5 leading-relaxed">{ln}</p>
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [url])
  if (loading) return <Spinner />
  return (
    <div className={`p-10 max-w-3xl mx-auto ${
      theme === 'dark' ? 'text-slate-200' : theme === 'sepia' ? 'text-[#3d2b1f]' : 'text-slate-800'
    }`}>{nodes}</div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// ZOOM-PAN WRAPPER
// Ctrl+Wheel = zoom | Pinch = zoom | Drag when zoomed = pan | Swipe = flip
// ══════════════════════════════════════════════════════════════════════

function ZoomPanWrapper({
  children, onSwipeLeft, onSwipeRight, disabled,
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  disabled?: boolean
}) {
  const [scale, setScale] = useState(1)
  const [pan, setPan]     = useState({ x: 0, y: 0 })
  const ref        = useRef<HTMLDivElement>(null)
  const lastDist   = useRef(0)
  const panActive  = useRef(false)
  const panOrigin  = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const swipeStart = useRef({ x: 0, t: 0 })
  const scaleRef   = useRef(1)
  const panRef     = useRef({ x: 0, y: 0 })

  scaleRef.current = scale
  panRef.current   = pan

  const clamp = (s: number, px: number, py: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const el = ref.current
    if (!el) return { x: px, y: py }
    const mx = (el.offsetWidth  * (s - 1)) / 2
    const my = (el.offsetHeight * (s - 1)) / 2
    return { x: Math.max(-mx, Math.min(mx, px)), y: Math.max(-my, Math.min(my, py)) }
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const f  = e.deltaY < 0 ? 1.12 : 0.9
      const ns = Math.max(0.5, Math.min(5, scaleRef.current * f))
      setScale(ns)
      if (ns <= 1.01) setPan({ x: 0, y: 0 })
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      } else if (e.touches.length === 1) {
        swipeStart.current = { x: e.touches[0].clientX, t: Date.now() }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        if (lastDist.current > 0) {
          const ratio = d / lastDist.current
          setScale(prev => Math.max(0.5, Math.min(5, prev * ratio)))
        }
        lastDist.current = d
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        lastDist.current = 0
        if (scaleRef.current > 1.1 || disabled) return
        const dx = e.changedTouches[0].clientX - swipeStart.current.x
        const dt = Date.now() - swipeStart.current.t
        if (Math.abs(dx) > 55 && dt < 450) {
          dx > 0 ? onSwipeRight?.() : onSwipeLeft?.()
        }
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

  const onMouseDown = (e: React.MouseEvent) => {
    if (scaleRef.current <= 1.05) return
    panActive.current = true
    panOrigin.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y }
    e.preventDefault()
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!panActive.current) return
    const nx = panOrigin.current.px + (e.clientX - panOrigin.current.mx)
    const ny = panOrigin.current.py + (e.clientY - panOrigin.current.my)
    setPan(clamp(scaleRef.current, nx, ny))
  }
  const stopPan = () => { panActive.current = false }

  return (
    <div ref={ref} className="w-full h-full overflow-hidden"
      style={{ cursor: scale > 1.05 ? 'grab' : 'default' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={stopPan} onMouseLeave={stopPan}
    >
      <div className="w-full h-full origin-center"
        style={{
          transform:     `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
          transition:    lastDist.current > 0 ? 'none' : 'transform 0.06s ease-out',
          willChange:    'transform',
          pointerEvents: panActive.current ? 'none' : 'auto',
        }}
      >
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


// ══════════════════════════════════════════════════════════════════════
// PDF PLUGIN HOST
// ──────────────────────────────────────────────────────────────────────
// react-pdf-viewer plugins call React hooks (useMemo etc.) when created.
// Rules:
//   ✅ Must be inside a React component
//   ✅ Must be unconditional — FIRST thing in the component, no hooks before them
//   ✅ Component must never change hook count between renders
//
// Solution: tiny dedicated component whose ONLY job is to own the plugins.
// Zero state, zero conditional hooks, zero other hooks before plugin creation.
// ══════════════════════════════════════════════════════════════════════

interface PDFHostProps {
  fileUrl:      string
  pdfTheme:     'dark' | 'light'
  scrollMode:   ScrollMode
  viewMode:     ViewMode
  showThumbs:   boolean
  thumbClass:   string
  onLoad:       (n: number) => void
  onPageChange: (n: number) => void
  onReady:      (jump: (page: number) => void) => void
}

function PDFPluginHost({
  fileUrl, pdfTheme, scrollMode, viewMode,
  showThumbs, thumbClass, onLoad, onPageChange, onReady,
}: PDFHostProps) {
  // ── Plugins FIRST — unconditional, nothing before them ──
  const toolbarPI = toolbarPlugin()
  const pageNavPI = pageNavigationPlugin()
  const thumbPI   = thumbnailPlugin()
  // ── Only after plugins: expose jumpToPage to parent ──
  useEffect(() => { onReady(pageNavPI.jumpToPage) }, []) // eslint-disable-line

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
            fileUrl={fileUrl}
            plugins={[toolbarPI, pageNavPI, thumbPI]}
            localization={ar_AE as any}
            onDocumentLoad={e  => onLoad(e.doc.numPages)}
            onPageChange={e    => onPageChange(e.currentPage)}
            defaultScale={SpecialZoomLevel.PageFit}
            scrollMode={scrollMode}
            viewMode={viewMode}
            theme={pdfTheme}
          />
        </Worker>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <toolbarPI.Toolbar>
            {(s) => (
              <div className="flex items-center rounded-full px-3 py-1.5 shadow-2xl border border-white/10 bg-black/65 backdrop-blur-xl gap-0.5">
                <TSlot><s.ZoomOut /></TSlot>
                <span className="text-white/60 text-[10px] font-black min-w-[2.5rem] text-center [&_span]:text-white/60 [&_span]:text-[10px] [&_span]:font-black">
                  <s.CurrentScale />
                </span>
                <TSlot><s.ZoomIn /></TSlot>
                <div className="w-px h-3.5 bg-white/20 mx-1.5" />
                <TSlot><s.ShowSearchPopover /></TSlot>
              </div>
            )}
          </toolbarPI.Toolbar>
        </div>
      </div>
    </div>
  )
}


function TSlot({ children }: { children: React.ReactNode }) {
  return (
    <div className="[&_button]:text-white/80 [&_button]:w-8 [&_button]:h-8 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-full [&_button:hover]:bg-white/15 [&_button]:transition-all">
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// ICON BUTTON
// ══════════════════════════════════════════════════════════════════════

function IBtn({
  icon, label, active, theme, onClick, activeColor, badge,
}: {
  icon: React.ReactNode; label: string; active?: boolean; theme: AppTheme
  onClick: () => void; activeColor?: string; badge?: number
}) {
  const off =
    theme === 'dark'  ? 'text-slate-400 hover:bg-slate-700/80 hover:text-white'       :
    theme === 'sepia' ? 'text-amber-900/50 hover:bg-amber-900/10 hover:text-amber-900' :
                        'text-slate-500 hover:bg-slate-100 hover:text-blue-600'
  return (
    <button onClick={onClick} title={label}
      className={`relative w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-150 active:scale-90 ${active ? 'text-white shadow-lg' : off}`}
      style={active ? { backgroundColor: activeColor || '#2563eb', boxShadow: `0 4px 16px ${activeColor || '#2563eb'}60` } : {}}>
      {icon}
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function PDiv({ theme }: { theme: AppTheme }) {
  return <div className={`w-6 h-px mx-auto ${theme==='dark'?'bg-slate-700':theme==='sepia'?'bg-amber-400/30':'bg-slate-200'}`} />
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════

function ReaderApp() {
  const params  = useSearchParams()
  const router  = useRouter()
  const fileUrl = params.get('file')  || ''
  const title   = params.get('title') || 'المرجع العلمي'
  const docType = (params.get('type') as DocType | null) || detectType(fileUrl)

  // ── State ─────────────────────────────────────────────────────────
  const [page,       setPage]      = useState(0)
  const [total,      setTotal]     = useState(0)
  const [theme,      setTheme]     = useState<AppTheme>('light')
  const [readMode,   setReadMode]  = useState<ReadMode>('single')
  const [focusMode,  setFocusMode] = useState(false)
  const [panel,      setPanel]     = useState<SidePanel>(null)
  const [mobileMenu, setMobile]    = useState(false)

  const [tool,      setTool]     = useState<DrawTool>('none')
  const [color,     setColor]    = useState(COLORS[0].hex)
  const [colorOpen, setColorOpen] = useState(false)
  const [annots,    setAnnots]   = useState<Annot[]>([])
  const [noteText,  setNoteText] = useState('')
  const [noteOpen,  setNoteOpen] = useState(false)

  const [videos,      setVideos]     = useState<VideoMarker[]>([])
  const [vForm,       setVForm]      = useState({ title: '', url: '' })
  const [addingVideo, setAddingVideo] = useState(false)

  const [flipPhase, setFlipPhase] = useState<FlipPhase>('idle')
  const [flipDir,   setFlipDir]   = useState<'next'|'prev'>('next')
  const flipLock    = useRef(false)

  const [editPage,  setEditPage]  = useState(false)
  const [pageInput, setPageInput] = useState('')

  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const jumpRef    = useRef<((p: number) => void) | null>(null)
  const jump       = (p: number) => jumpRef.current?.(p)
  const drawActive = useRef(false)
  const lastPt     = useRef<{x:number;y:number}|null>(null)

  // ── Persistence ───────────────────────────────────────────────────
  useEffect(() => {
    if (!fileUrl) return
    setAnnots(ls.get<Annot[]>(sKey(fileUrl,'annots'), []))
    setVideos(ls.get<VideoMarker[]>(sKey(fileUrl,'videos'), []))
    const lp = ls.get<number>(sKey(fileUrl,'page'), 0)
    if (lp > 0) setTimeout(() => jump(lp), 900)
  }, [fileUrl])

  useEffect(() => { if (fileUrl) ls.set(sKey(fileUrl,'annots'), annots) }, [annots, fileUrl])
  useEffect(() => { if (fileUrl) ls.set(sKey(fileUrl,'videos'), videos) }, [videos, fileUrl])
  useEffect(() => { if (fileUrl && total > 0) ls.set(sKey(fileUrl,'page'), page) }, [page, fileUrl, total])

  // ── Keyboard ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') doFlip('next')
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   doFlip('prev')
      if (e.key === 'Escape') { setFocusMode(false); setTool('none'); setColorOpen(false); setPanel(null) }
      if (e.key === 'f' && !e.ctrlKey) setFocusMode(v => !v)
      if (e.key === 'h') setTool(t => t==='highlight' ? 'none' : 'highlight')
      if (e.key === 'p') setTool(t => t==='pen'       ? 'none' : 'pen')
      if (e.key === 'u') setTool(t => t==='underline' ? 'none' : 'underline')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [page]) // eslint-disable-line

  // ── Flip ──────────────────────────────────────────────────────────
  const doFlip = useCallback((dir: 'next'|'prev') => {
    if (flipLock.current) return
    const target = dir === 'next' ? page + 1 : page - 1
    if (target < 0 || (total > 0 && target >= total)) return
    flipLock.current = true
    setFlipDir(dir)
    setFlipPhase('out')
    setTimeout(() => {
      jump(target)
      setFlipPhase('in')
      setTimeout(() => { setFlipPhase('idle'); flipLock.current = false }, 300)
    }, 300)
  }, [page, total])

  // ── Canvas ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || tool !== 'pen') return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio
    canvas.width  = canvas.offsetWidth  * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)
    const pt = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const down = (e: MouseEvent) => { drawActive.current = true; lastPt.current = pt(e) }
    const up   = ()              => { drawActive.current = false; lastPt.current = null }
    const move = (e: MouseEvent) => {
      if (!drawActive.current || !lastPt.current) return
      const c = pt(e)
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2.5
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(c.x, c.y); ctx.stroke()
      lastPt.current = c
    }
    canvas.addEventListener('mousedown', down)
    canvas.addEventListener('mouseup',   up)
    window.addEventListener('mouseup',   up)
    canvas.addEventListener('mousemove', move)
    return () => {
      canvas.removeEventListener('mousedown', down)
      canvas.removeEventListener('mouseup',   up)
      window.removeEventListener('mouseup',   up)
      canvas.removeEventListener('mousemove', move)
    }
  }, [tool, color])

  const clearCanvas = () => { const c = canvasRef.current; if (c) c.getContext('2d')?.clearRect(0, 0, c.width, c.height) }
  const addAnnot    = (type: DrawTool, note?: string) => setAnnots(prev => [...prev, {
    id: Math.random().toString(36).slice(2), type, page, color, note,
    createdAt: new Date().toLocaleString('ar-EG'),
  }])
  const addVideo = () => {
    if (!vForm.url.trim()) return
    setVideos(prev => [...prev, { id: Math.random().toString(36).slice(2), page, title: vForm.title || `فيديو ص${page+1}`, url: vForm.url }])
    setVForm({ title: '', url: '' }); setAddingVideo(false)
  }

  // ── Theme tokens ──────────────────────────────────────────────────
  const T = {
    root:    { light:'bg-slate-100',             dark:'bg-[#0d1117]',               sepia:'bg-[#f0e6c8]'               }[theme],
    header:  { light:'bg-white/97 border-slate-200/80', dark:'bg-[#161b22]/97 border-slate-700/50', sepia:'bg-[#ede0be]/97 border-amber-400/40' }[theme],
    panel:   { light:'bg-white border-slate-200',       dark:'bg-[#161b22] border-slate-700',       sepia:'bg-[#ede0be] border-amber-300/60'    }[theme],
    pill:    { light:'bg-white/97 border-slate-200 shadow-slate-300/50',   dark:'bg-[#1c2128]/97 border-slate-700/70 shadow-black/40',   sepia:'bg-[#e8d5a3]/97 border-amber-300/50 shadow-amber-900/10' }[theme],
    viewer:  { light:'bg-white',                 dark:'bg-[#0d1117]',               sepia:'bg-[#f5e8cc]'               }[theme],
    footer:  { light:'bg-white border-slate-200 text-slate-400',          dark:'bg-[#161b22] border-slate-700 text-slate-500',          sepia:'bg-[#ede0be] border-amber-300/50 text-amber-800/50' }[theme],
    txt:     { light:'text-slate-800',            dark:'text-slate-100',             sepia:'text-[#3d2b1f]'             }[theme],
    sub:     { light:'text-slate-500',            dark:'text-slate-400',             sepia:'text-amber-900/60'          }[theme],
    input:   { light:'bg-slate-100 border-slate-200 text-slate-800',      dark:'bg-slate-800 border-slate-700 text-slate-100',          sepia:'bg-amber-50 border-amber-300 text-amber-900'            }[theme],
    badge:   { light:'bg-slate-100 border-slate-200',                     dark:'bg-slate-800 border-slate-700',                         sepia:'bg-amber-100/70 border-amber-300/60'                    }[theme],
    row:     { light:'hover:bg-slate-50',         dark:'hover:bg-slate-800/60',      sepia:'hover:bg-amber-50/60'       }[theme],
    ph:      { light:'bg-slate-50 border-slate-100',                      dark:'bg-[#1c2128] border-slate-700',                         sepia:'bg-amber-50/50 border-amber-200/60'                     }[theme],
  }

  const flipStyle = (() => {
    const ox = flipDir === 'next' ? '0%' : '100%'
    if (flipPhase === 'idle') return { transform: 'rotateY(0deg)',   transformOrigin: `${ox} 50%` }
    if (flipPhase === 'out')  return { transform: flipDir === 'next' ? 'rotateY(-90deg) scale(0.96)' : 'rotateY(90deg) scale(0.96)', transformOrigin: `${ox} 50%` }
    return                           { transform: 'rotateY(0deg)',   transformOrigin: `${ox} 50%` }
  })()

  const progress   = total > 0 ? Math.round(((page + 1) / total) * 100) : 0
  const pageVideos = videos.filter(v => v.page === page)

  if (!fileUrl) return (
    <div className="h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 text-white">
      <FileText size={60} className="opacity-15" />
      <h2 className="text-2xl font-black opacity-40">لا يوجد ملف</h2>
    </div>
  )

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${T.root} ${T.txt}`} dir="rtl">

      {/* ═══════════════ HEADER ═══════════════ */}
      {!focusMode && (
        <header className={`shrink-0 z-[300] flex items-center justify-between px-3 md:px-5 h-14 backdrop-blur-xl border-b transition-colors ${T.header}`}>

          {/* Close + Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button onClick={() => router.back()}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-xl shadow-md shadow-rose-500/30 transition-all">
              <X size={14} />
            </button>
            <div className="min-w-0 hidden sm:block">
              <h1 className={`font-black text-sm truncate max-w-[140px] md:max-w-[360px] ${T.txt}`}>{title}</h1>
              <div className="flex items-center gap-1.5 mt-px">
                <span className="text-[8px] font-black tracking-[.15em] uppercase text-blue-500 flex items-center gap-1">
                  <ShieldCheck size={8} /> Secure
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${T.badge} ${
                  docType==='pdf'?'text-rose-500':docType==='docx'?'text-blue-500':docType==='pptx'?'text-orange-500':'text-emerald-500'
                }`}>{docType.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Page nav */}
          <div className={`flex items-center gap-0.5 px-1.5 py-1 rounded-2xl border ${T.badge}`}>
            <button onClick={() => doFlip('prev')} disabled={page === 0}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 ${theme==='dark'?'hover:bg-slate-700 text-blue-400':'hover:bg-slate-100 text-blue-600'}`}>
              <ChevronRight size={15} />
            </button>
            {editPage ? (
              <input autoFocus type="number" value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onBlur={() => { const p = +pageInput-1; if (!isNaN(p) && p >= 0 && p < total) jump(p); setEditPage(false) }}
                onKeyDown={e => { if (e.key==='Enter') { const p = +pageInput-1; if (!isNaN(p)) jump(p); setEditPage(false) } if (e.key==='Escape') setEditPage(false) }}
                className={`w-10 text-center text-sm font-black rounded-lg border px-1 py-0.5 outline-none focus:ring-2 ring-blue-500 ${T.input}`}
              />
            ) : (
              <button onClick={() => { setPageInput(String(page+1)); setEditPage(true) }}
                className="flex items-center gap-1 px-2 font-black text-sm hover:opacity-60 transition-all">
                <span className="text-blue-500">{page+1}</span>
                <span className="opacity-20">/</span>
                <span className={`text-xs ${T.sub}`}>{total||'–'}</span>
              </button>
            )}
            <button onClick={() => doFlip('next')} disabled={total > 0 && page >= total-1}
              className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all disabled:opacity-20 ${theme==='dark'?'hover:bg-slate-700 text-blue-400':'hover:bg-slate-100 text-blue-600'}`}>
              <ChevronLeft size={15} />
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            <button onClick={() => setTheme(t => t==='light'?'dark':t==='dark'?'sepia':'light')}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme==='dark'?'hover:bg-slate-700':'hover:bg-slate-100'}`}>
              {theme==='light'?<Moon size={15}/>:theme==='dark'?<Sun size={15}/>:<Palette size={15}/>}
            </button>
            <div className={`hidden md:flex items-center gap-px p-0.5 rounded-xl border ${T.badge}`}>
              {([{m:'single',icon:<BookOpen size={13}/>,tip:'صفحة واحدة'},{m:'double',icon:<Columns size={13}/>,tip:'صفحتان'}] as const).map(({m,icon,tip}) => (
                <button key={m} onClick={() => setReadMode(m)} title={tip}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    readMode===m?'bg-blue-600 text-white':theme==='dark'?'text-slate-400 hover:bg-slate-700':'text-slate-500 hover:bg-white'
                  }`}>{icon}<span className="hidden lg:inline">{tip}</span></button>
              ))}
            </div>
            <button onClick={() => setFocusMode(true)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme==='dark'?'bg-slate-700 hover:bg-slate-600 text-slate-200':'bg-slate-900 hover:bg-slate-700 text-white'}`}>
              <Maximize2 size={15} />
            </button>
            <button onClick={() => setMobile(!mobileMenu)}
              className={`md:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all ${theme==='dark'?'hover:bg-slate-700':'hover:bg-slate-100'}`}>
              <Menu size={15} />
            </button>
          </div>
        </header>
      )}

      {/* Mobile mode selector */}
      {mobileMenu && !focusMode && (
        <div className={`md:hidden shrink-0 z-[290] border-b px-4 py-3 flex gap-2 ${T.panel}`}>
          {([{m:'single',label:'صفحة واحدة'},{m:'double',label:'صفحتان'}] as const).map(({m,label}) => (
            <button key={m} onClick={() => { setReadMode(m); setMobile(false) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${readMode===m?'bg-blue-600 text-white':`border ${T.badge}`}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════ BODY ═══════════════ */}
      <div className="flex-grow relative flex overflow-hidden">

        {/* Right annotation pill */}
        {!focusMode && (
          <div className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-0.5 p-1.5 rounded-[1.6rem] border shadow-2xl backdrop-blur-2xl ${T.pill}`}>
            <IBtn icon={<Type        size={16}/>} label="تحديد (افتراضي)" theme={theme} active={tool==='none'}      activeColor="#64748b" onClick={() => setTool('none')} />
            <PDiv theme={theme} />
            <IBtn icon={<Highlighter size={16}/>} label="تظليل (H)"        theme={theme} active={tool==='highlight'} activeColor={color}   onClick={() => { setTool(t => t==='highlight'?'none':'highlight'); if (tool!=='highlight') addAnnot('highlight') }} />
            <IBtn icon={<Underline   size={16}/>} label="تسطير (U)"        theme={theme} active={tool==='underline'} activeColor={color}   onClick={() => { setTool(t => t==='underline'?'none':'underline'); if (tool!=='underline') addAnnot('underline') }} />
            <IBtn icon={<Pen         size={16}/>} label="قلم (P)"          theme={theme} active={tool==='pen'}       activeColor={color}   onClick={() => setTool(t => t==='pen'?'none':'pen')} />
            <IBtn icon={<MessageSquare size={16}/>} label="ملاحظة"         theme={theme} active={tool==='note'}      activeColor="#7c3aed" onClick={() => { setTool('note'); setNoteOpen(true) }} />
            <IBtn icon={<Eraser      size={16}/>} label="ممحاة"            theme={theme} active={tool==='eraser'}    activeColor="#ef4444" onClick={() => { setTool(t => t==='eraser'?'none':'eraser'); clearCanvas() }} />
            <PDiv theme={theme} />
            {/* Color picker */}
            <div className="relative">
              <button onClick={() => setColorOpen(!colorOpen)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow border-2 border-white/20"
                style={{ backgroundColor: color }}>
                <Palette size={13} className="text-white drop-shadow" />
              </button>
              {colorOpen && (
                <div className={`absolute right-12 top-0 p-3 rounded-2xl border shadow-2xl z-[310] min-w-[120px] ${T.panel}`}>
                  <p className={`text-[8px] font-black uppercase tracking-[.2em] mb-2 ${T.sub}`}>اللون</p>
                  <div className="flex flex-col gap-0.5">
                    {COLORS.map(c => (
                      <button key={c.hex} onClick={() => { setColor(c.hex); setColorOpen(false) }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:scale-[1.02] ${color===c.hex?'ring-2 ring-blue-500 ring-offset-1':''}`}
                        style={color===c.hex?{backgroundColor:`${c.hex}20`}:{}}>
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.hex, boxShadow: `0 0 6px ${c.glow}` }} />
                        <span className={`text-[10px] font-bold ${T.txt}`}>{c.label}</span>
                        {color === c.hex && <Check size={10} className="ml-auto text-blue-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left panel pill */}
        {!focusMode && (
          <div className={`absolute left-1.5 md:left-2.5 top-1/2 -translate-y-1/2 z-[200] flex flex-col gap-0.5 p-1.5 rounded-[1.6rem] border shadow-2xl backdrop-blur-2xl ${T.pill}`}>
            <IBtn icon={<Grid     size={16}/>} label="صور مصغرة" theme={theme} active={panel==='thumbs'} onClick={() => setPanel(p => p==='thumbs'?null:'thumbs')} />
            <IBtn icon={<Bookmark size={16}/>} label="التعليقات" theme={theme} active={panel==='annots'} badge={annots.length} onClick={() => setPanel(p => p==='annots'?null:'annots')} />
            <IBtn icon={<Search   size={16}/>} label="بحث"       theme={theme} active={panel==='search'} onClick={() => setPanel(p => p==='search'?null:'search')} />
            <IBtn icon={<Video    size={16}/>} label="فيديوهات"  theme={theme} active={panel==='videos'} badge={pageVideos.length} onClick={() => setPanel(p => p==='videos'?null:'videos')} />
          </div>
        )}

        {/* Side panel */}
        {!focusMode && panel && (
          <aside className={`shrink-0 w-[250px] md:w-[270px] border-l z-[150] flex flex-col ${T.panel}`}>
            <div className={`px-4 py-2.5 border-b flex items-center justify-between text-[9px] font-black uppercase tracking-[.2em] ${T.sub} ${T.ph}`}>
              <span>{{thumbs:'الصفحات',annots:'التعليقات',search:'البحث',videos:'فيديوهات'}[panel]}</span>
              <button onClick={() => setPanel(null)} className={`p-1 rounded-lg ${theme==='dark'?'hover:bg-slate-700':'hover:bg-slate-200'} transition-all`}><X size={12}/></button>
            </div>
            <div className="flex-grow overflow-y-auto custom-sb p-2.5">

              {/* Thumbs — rendered inside PDFCore when showThumbs=true */}
              {panel === 'thumbs' && (
                <p className={`text-[10px] text-center mt-6 leading-relaxed ${T.sub}`}>
                  الصور المصغرة تظهر داخل منطقة القارئ عند فتح هذا اللوح
                </p>
              )}

              {/* Annotations */}
              {panel === 'annots' && (
                <div className="flex flex-col gap-1.5">
                  {annots.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <Highlighter size={32} className="opacity-15" />
                      <p className={`text-xs font-bold ${T.sub}`}>لا توجد تعليقات</p>
                      <p className={`text-[10px] ${T.sub} opacity-60`}>استخدم أدوات التظليل والكتابة</p>
                    </div>
                  ) : [...annots].reverse().map(a => (
                    <div key={a.id} className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${T.row} ${T.panel}`}
                      onClick={() => jump(a.page)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:a.color,boxShadow:`0 0 5px ${a.color}`}} />
                          <span className={`font-black text-[10px] ${T.sub}`}>ص {a.page+1}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setAnnots(prev => prev.filter(x => x.id !== a.id)) }}
                          className="p-0.5 rounded hover:text-rose-500 opacity-40 hover:opacity-100 transition-all"><Trash2 size={10}/></button>
                      </div>
                      <div className={`flex items-center gap-1 ${T.sub} opacity-60`}>
                        {a.type==='highlight'?<Highlighter size={9}/>:a.type==='underline'?<Underline size={9}/>:a.type==='note'?<StickyNote size={9}/>:<Pen size={9}/>}
                        <span className="font-bold text-[10px]">{a.type==='highlight'?'تظليل':a.type==='underline'?'تسطير':a.type==='pen'?'رسم':'ملاحظة'}</span>
                      </div>
                      {a.note && <p className={`mt-1 text-[11px] leading-relaxed ${T.txt} opacity-80`}>{a.note}</p>}
                    </div>
                  ))}
                  {annots.length > 0 && (
                    <button onClick={() => setAnnots([])} className="mt-1 text-[10px] font-black text-rose-500 hover:text-rose-600 text-center py-1">مسح الكل</button>
                  )}
                </div>
              )}

              {/* Search */}
              {panel === 'search' && (
                <div className={`mt-2 p-3 rounded-xl border text-xs ${T.panel}`}>
                  <p className={`${T.sub} leading-relaxed`}>اضغط على أيقونة 🔍 في شريط التكبير أسفل الصفحة للبحث داخل المستند</p>
                </div>
              )}

              {/* Videos */}
              {panel === 'videos' && (
                <div className="flex flex-col gap-2">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${T.sub}`}>فيديوهات صفحة {page+1}</p>
                  {videos.filter(v => v.page===page).map(v => (
                    <div key={v.id} className={`p-2.5 rounded-xl border text-xs ${T.panel}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-black text-[11px] ${T.txt}`}>{v.title}</span>
                        <button onClick={() => setVideos(prev => prev.filter(x => x.id!==v.id))} className="p-0.5 rounded hover:text-rose-500 opacity-40 hover:opacity-100 transition-all"><Trash2 size={10}/></button>
                      </div>
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 text-[10px] truncate block">{v.url}</a>
                    </div>
                  ))}
                  {videos.filter(v => v.page===page).length===0 && !addingVideo && (
                    <p className={`text-[10px] ${T.sub} text-center py-3`}>لا توجد فيديوهات لهذه الصفحة</p>
                  )}
                  {addingVideo ? (
                    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${T.panel}`}>
                      <input value={vForm.title} onChange={e => setVForm(f => ({...f,title:e.target.value}))} placeholder="عنوان الفيديو"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 ring-blue-500 ${T.input}`} />
                      <input value={vForm.url} onChange={e => setVForm(f => ({...f,url:e.target.value}))} placeholder="رابط الفيديو *"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:ring-2 ring-blue-500 ${T.input}`} />
                      <div className="flex gap-1.5">
                        <button onClick={addVideo} className="flex-1 py-1.5 rounded-lg text-[10px] font-black bg-blue-600 text-white hover:bg-blue-700 transition-all">إضافة</button>
                        <button onClick={() => setAddingVideo(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border transition-all ${T.badge}`}>إلغاء</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingVideo(true)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed text-[10px] font-black text-blue-500 hover:bg-blue-500/5 transition-all">
                      <Plus size={12}/> ربط فيديو بهذه الصفحة
                    </button>
                  )}
                  {videos.length > 0 && (
                    <>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${T.sub}`}>كل الفيديوهات ({videos.length})</p>
                      {videos.map(v => (
                        <div key={v.id} className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer ${T.row} ${T.panel}`}
                          onClick={() => jump(v.page)}>
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Video size={11} className="text-blue-500"/></div>
                          <div className="min-w-0"><p className={`font-black text-[10px] truncate ${T.txt}`}>{v.title}</p><p className={`text-[9px] ${T.sub}`}>ص {v.page+1}</p></div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Note modal */}
        {noteOpen && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => { setNoteOpen(false); setTool('none') }}>
            <div className={`relative w-80 rounded-3xl border p-5 shadow-2xl ${T.panel}`} onClick={e => e.stopPropagation()}>
              <h3 className={`font-black text-sm mb-3 ${T.txt}`}>ملاحظة — صفحة {page+1}</h3>
              <textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                placeholder="اكتب ملاحظتك..."
                className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 ring-purple-500 resize-none ${T.input}`} />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={() => { setNoteOpen(false); setNoteText(''); setTool('none') }}
                  className={`px-4 py-2 rounded-xl text-xs font-black border ${T.badge}`}>إلغاء</button>
                <button onClick={() => { addAnnot('note', noteText||'(ملاحظة)'); setNoteOpen(false); setNoteText(''); setTool('none') }}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/30 transition-all">حفظ</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main className={`flex-grow relative h-full overflow-hidden transition-all ${
          focusMode ? '' : 'p-2.5 md:p-4 pr-14 pl-14 md:pr-16 md:pl-16'
        } ${T.root}`} dir="ltr">

          {/* Video badge */}
          {pageVideos.length > 0 && !focusMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[150] flex gap-2 flex-wrap justify-center">
              {pageVideos.map(v => (
                <a key={v.id} href={v.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 bg-black/70 text-white text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/10 hover:bg-black/90 transition-all shadow-xl">
                  <Video size={11} className="text-blue-400"/> {v.title}
                </a>
              ))}
            </div>
          )}

          {/* Viewer card */}
          <div className={`h-full w-full relative overflow-hidden transition-all duration-300 ${
            focusMode ? '' : `rounded-2xl md:rounded-3xl shadow-2xl border ${
              theme==='dark'?'border-slate-700/70':theme==='sepia'?'border-amber-300/40':'border-slate-200/80'
            }`
          } ${T.viewer}`} style={{ perspective: '2400px' }}>

            {/* Flip wrapper */}
            <div className="w-full h-full" style={{ ...flipStyle, transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              <ZoomPanWrapper
                onSwipeLeft={() => doFlip('next')}
                onSwipeRight={() => doFlip('prev')}
                disabled={flipPhase !== 'idle'}
              >
                {docType === 'pdf' && (
                  <PDFPluginHost
                    fileUrl={fileUrl}
                    pdfTheme={theme==='dark'?'dark':'light'}
                    scrollMode={ScrollMode.Page}
                    viewMode={readMode==='double'?ViewMode.DualPage:ViewMode.SinglePage}
                    showThumbs={panel==='thumbs'}
                    thumbClass={`w-[190px] border-r ${T.panel.split(' ').slice(0,2).join(' ')}`}
                    onLoad={n => setTotal(n)}
                    onPageChange={n => setPage(n)}
                    onReady={fn => { jumpRef.current = fn }}
                  />
                )}
                {docType === 'docx' && <div className="h-full overflow-y-auto custom-sb"><DocxViewer url={fileUrl} theme={theme}/></div>}
                {docType === 'pptx' && <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`} className="w-full h-full border-none" title="عرض تقديمي"/>}
                {docType === 'md'   && <div className="h-full overflow-y-auto custom-sb"><MdViewer url={fileUrl} theme={theme}/></div>}
              </ZoomPanWrapper>
            </div>

            {/* Pen canvas */}
            {tool === 'pen' && (
              <canvas ref={canvasRef} className="absolute inset-0 z-[90] cursor-crosshair"
                style={{ width:'100%', height:'100%', pointerEvents:'all' }} />
            )}

            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none z-[30] opacity-[0.018] flex items-center justify-center overflow-hidden select-none">
              <span className="text-[9vw] font-black rotate-[-25deg] whitespace-nowrap uppercase tracking-[.3em]">Nursing Digital Library</span>
            </div>

            {/* Focus exit */}
            {focusMode && (
              <button onClick={() => setFocusMode(false)}
                className="absolute top-5 right-5 z-[1000] w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-xl text-white rounded-full hover:bg-rose-500 transition-all shadow-2xl border border-white/10">
                <X size={18}/>
              </button>
            )}

            {/* Flip arrows */}
            {docType === 'pdf' && flipPhase === 'idle' && (
              <>
                <button onClick={() => doFlip('prev')} disabled={page===0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md hover:bg-black/20 rounded-full transition-all disabled:opacity-0 border border-white/10 shadow-lg">
                  <ChevronRight size={22} className={T.txt}/>
                </button>
                <button onClick={() => doFlip('next')} disabled={total>0&&page>=total-1}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 flex items-center justify-center bg-black/10 backdrop-blur-md hover:bg-black/20 rounded-full transition-all disabled:opacity-0 border border-white/10 shadow-lg">
                  <ChevronLeft size={22} className={T.txt}/>
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ═══════════════ FOOTER ═══════════════ */}
      {!focusMode && (
        <footer className={`shrink-0 h-8 px-5 flex items-center justify-between text-[8px] font-black uppercase tracking-[.12em] z-[300] relative overflow-hidden border-t ${T.footer}`}>
          <div className="absolute top-0 right-0 h-[2px] transition-all duration-500"
            style={{ width:`${progress}%`, background:'linear-gradient(to left,#2563eb,#7c3aed)' }} />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/> Secure</span>
            <span className={`px-1.5 py-0.5 rounded border text-[7px] ${T.badge} ${readMode==='single'?'text-blue-500':'text-purple-500'}`}>
              {readMode==='single'?'Single':'Dual'}
            </span>
            {tool !== 'none' && (
              <span className="flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor:color}}/>
                {tool==='highlight'?'تظليل':tool==='pen'?'رسم':tool==='underline'?'تسطير':tool==='note'?'ملاحظة':'ممحاة'}
              </span>
            )}
            <span className={`hidden md:flex items-center gap-1 ${theme==='dark'?'text-blue-400':theme==='sepia'?'text-amber-700':'text-blue-500'}`}>
              <Info size={9}/> {progress}%
            </span>
          </div>
          <p>© Nursing RST Hub 2026</p>
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
        .docx-body p{margin-bottom:.7em}
        .docx-body h1{font-size:2em;font-weight:900;margin:1em 0 .4em}
        .docx-body h2{font-size:1.5em;font-weight:800;margin:.8em 0 .35em}
        .docx-body h3{font-size:1.2em;font-weight:700;margin:.7em 0 .3em}
        .docx-body table{border-collapse:collapse;width:100%;margin:1em 0}
        .docx-body td,.docx-body th{border:1px solid #e2e8f0;padding:7px 11px}
        .docx-body th{background:#f8fafc;font-weight:700}
        .docx-body img{max-width:100%;border-radius:8px}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════════════════════════════

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-8">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 animate-spin border-t-blue-500"/>
          <div className="absolute inset-2 rounded-full border-4 border-purple-500/20 animate-spin border-b-purple-400" style={{animationDirection:'reverse',animationDuration:'1.3s'}}/>
          <div className="absolute inset-4 rounded-full border-2 border-cyan-400/20 animate-pulse"/>
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