'use client'
import { useRef, useState, useEffect } from 'react'
import {
    Heart, Activity, ShieldPlus, Brain, Baby, Users,
    LayoutGrid, ChevronRight, ChevronLeft,
    Stethoscope, FlaskConical, Pill, Microscope,
    Wind, Bone, Eye, Ear, Smile, Syringe, BookOpen
} from "lucide-react"
import { supabase } from '@/lib/supabase'

// ── أيقونة لكل key معروف — أي key جديد يأخذ BookOpen ──────
const iconMap: Record<string, React.ReactNode> = {
    all:         <LayoutGrid size={28} />,
    internal:    <Heart size={28} />,
    critical:    <Activity size={28} />,
    ethics:      <ShieldPlus size={28} />,
    psych:       <Brain size={28} />,
    pediatric:   <Baby size={28} />,
    community:   <Users size={28} />,
    surgery:     <Stethoscope size={28} />,
    pharmacy:    <Pill size={28} />,
    lab:         <FlaskConical size={28} />,
    research:    <Microscope size={28} />,
    respiratory: <Wind size={28} />,
    ortho:       <Bone size={28} />,
    ophth:       <Eye size={28} />,
    ent:         <Ear size={28} />,
    dental:      <Smile size={28} />,
    injection:   <Syringe size={28} />,
}

// ── لوحة ألوان تتناوب تلقائياً على الأقسام ────────────────
const colorPalette = [
    { color: "from-rose-500 to-red-600",        bg: "bg-rose-100/50",    text: "text-rose-600"    },
    { color: "from-indigo-500 to-purple-600",   bg: "bg-indigo-100/50",  text: "text-indigo-600"  },
    { color: "from-emerald-500 to-teal-600",    bg: "bg-emerald-100/50", text: "text-emerald-600" },
    { color: "from-purple-500 to-fuchsia-600",  bg: "bg-purple-100/50",  text: "text-purple-600"  },
    { color: "from-orange-500 to-amber-600",    bg: "bg-orange-100/50",  text: "text-orange-600"  },
    { color: "from-cyan-500 to-blue-600",       bg: "bg-cyan-100/50",    text: "text-cyan-600"    },
    { color: "from-pink-500 to-rose-600",       bg: "bg-pink-100/50",    text: "text-pink-600"    },
    { color: "from-teal-500 to-emerald-600",    bg: "bg-teal-100/50",    text: "text-teal-600"    },
    { color: "from-violet-500 to-purple-600",   bg: "bg-violet-100/50",  text: "text-violet-600"  },
    { color: "from-amber-500 to-yellow-600",    bg: "bg-amber-100/50",   text: "text-amber-600"   },
    { color: "from-sky-500 to-cyan-600",        bg: "bg-sky-100/50",     text: "text-sky-600"     },
]

// ── النوع الداخلي للشريحة ──────────────────────────────────
interface Slide {
    id: string
    title: string
    icon: React.ReactNode
    color: string
    bg: string
    text: string
}

// ── الكارت الثابت "الكل" — دايماً أول واحد ────────────────
const ALL_SLIDE: Slide = {
    id: 'all', title: 'الكل',
    icon: <LayoutGrid size={28} />,
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-100/50", text: "text-blue-600",
}

// ── الأقسام الافتراضية لو Supabase فاضية أو بطيء ──────────
const DEFAULT_SLIDES: Slide[] = [
    { id: 'internal',  title: "تمريض باطني",   icon: <Heart size={28} />,     color: "from-rose-500 to-red-600",       bg: "bg-rose-100/50",    text: "text-rose-600"    },
    { id: 'critical',  title: "عناية مركزة",   icon: <Activity size={28} />,  color: "from-indigo-500 to-purple-600",  bg: "bg-indigo-100/50",  text: "text-indigo-600"  },
    { id: 'ethics',    title: "أخلاقيات مهنة", icon: <ShieldPlus size={28} />,color: "from-emerald-500 to-teal-600",   bg: "bg-emerald-100/50", text: "text-emerald-600" },
    { id: 'psych',     title: "صحة نفسية",     icon: <Brain size={28} />,     color: "from-purple-500 to-fuchsia-600", bg: "bg-purple-100/50",  text: "text-purple-600"  },
    { id: 'pediatric', title: "تمريض أطفال",   icon: <Baby size={28} />,      color: "from-orange-500 to-amber-600",   bg: "bg-orange-100/50",  text: "text-orange-600"  },
    { id: 'community', title: "صحة مجتمع",     icon: <Users size={28} />,     color: "from-cyan-500 to-blue-600",      bg: "bg-cyan-100/50",    text: "text-cyan-600"    },
]

export default function InfoSlider({ selected, onSelect }: { selected: string, onSelect: (v: string) => void }) {
    const scrollRef     = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)
    const startXRef     = useRef(0)
    const scrollLeftRef = useRef(0)

    const [isDragging,     setIsDragging]     = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [slides,         setSlides]         = useState<Slide[]>([ALL_SLIDE, ...DEFAULT_SLIDES])

    // ── جلب الأقسام من Supabase وتحديث الشرائح ────────────
    useEffect(() => {
        supabase
            .from('categories')
            .select('*')
            .order('order', { ascending: true })
            .then(({ data }) => {
                if (!data || data.length === 0) return          // يبقى على الافتراضي
                const dynamic: Slide[] = data.map((cat, i) => ({
                    id:    cat.key,
                    title: cat.label,
                    icon:  iconMap[cat.key] ?? <BookOpen size={28} />,
                    ...colorPalette[i % colorPalette.length],
                }))
                setSlides([ALL_SLIDE, ...dynamic])
            })
    }, [])

    // ── بكرة الماوس → تمرير أفقي ──────────────────────────
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return
            e.preventDefault()
            el.scrollTo({ left: el.scrollLeft + e.deltaY * 3, behavior: 'auto' })
        }
        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [])

    const updateProgress = () => {
        const el = scrollRef.current
        if (!el) return
        const max = el.scrollWidth - el.clientWidth
        if (max <= 0) return
        setScrollProgress((Math.abs(el.scrollLeft) / max) * 100)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true
        setIsDragging(true)
        startXRef.current     = e.pageX - (scrollRef.current?.offsetLeft || 0)
        scrollLeftRef.current = scrollRef.current?.scrollLeft || 0
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollRef.current) return
        e.preventDefault()
        const x = e.pageX - (scrollRef.current.offsetLeft || 0)
        scrollRef.current.scrollLeft = scrollLeftRef.current - (x - startXRef.current) * 1.5
        updateProgress()
    }

    const stopDrag = () => { isDraggingRef.current = false; setIsDragging(false) }

    return (
        <section className="w-full mt-12 select-none">

            {/* الهيدر */}
            <div className="flex flex-col md:flex-row items-end justify-between px-10 mb-10 gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-2.5 h-14 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-200"></div>
                    <div>
                        <h3 className="font-black text-4xl text-slate-800 tracking-tight">تصفح حسب التخصص</h3>
                        <p className="text-slate-400 font-bold text-sm mt-1">اضغط واسحب لاستكشاف المجالات الطبية ↔️</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-3">
                    <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                        className="p-3 bg-white border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-90">
                        <ChevronRight size={24} />
                    </button>
                    <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
                        className="p-3 bg-white border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-90">
                        <ChevronLeft size={24} />
                    </button>
                </div>
            </div>

            {/* الكروت */}
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrag}
                onMouseLeave={stopDrag}
                onScroll={updateProgress}
                className={`flex gap-8 overflow-x-auto pb-14 pt-6 no-scrollbar px-10 scroll-smooth ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            >
                {slides.map((s) => {
                    const isSelected = selected === s.id
                    return (
                        <button
                            key={s.id}
                            onClick={() => !isDraggingRef.current && onSelect(s.id)}
                            className="relative flex-shrink-0 outline-none group"
                        >
                            <div className={`relative w-[260px] h-[280px] rounded-[3rem] border transition-all duration-700 flex flex-col items-center justify-center overflow-hidden
                                ${isSelected
                                    ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] -translate-y-4 scale-105`
                                    : 'bg-white/40 backdrop-blur-xl border-white/80 text-slate-700 hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2'
                                }`}>

                                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-1000 ${isSelected ? 'bg-white/20' : 'bg-blue-400/20'}`}></div>

                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-[10deg]
                                    ${isSelected ? 'bg-white/20 backdrop-blur-md shadow-blue-900/10' : `${s.bg} ${s.text}`}`}>
                                    {s.icon}
                                </div>

                                <h4 className="font-black text-2xl tracking-tight mb-2">{s.title}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${isSelected ? 'text-blue-50' : 'text-slate-400'}`}>
                                    Nursing Department
                                </span>

                                {isSelected && (
                                    <div className="absolute top-6 left-6 w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* شريط التقدم */}
            <div className="px-10 max-w-4xl mx-auto">
                <div className="relative h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden border border-white/50 shadow-inner">
                    <div
                        className="absolute right-0 h-full bg-gradient-to-l from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${Math.max(15, scrollProgress)}%` }}
                    ></div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    )
}