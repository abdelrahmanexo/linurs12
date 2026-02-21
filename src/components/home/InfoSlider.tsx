'use client'
import { useRef, useState, useEffect } from 'react'
import { Heart, Activity, ShieldPlus, Brain, Baby, Users, LayoutGrid, ChevronRight, ChevronLeft } from "lucide-react";

const slides = [
    { id: 'all', title: "الكل", icon: <LayoutGrid size={28} />, color: "from-blue-500 to-blue-700", bg: "bg-blue-100/50", text: "text-blue-600" },
    { id: 'internal', title: "تمريض باطني", icon: <Heart size={28} />, color: "from-rose-500 to-red-600", bg: "bg-rose-100/50", text: "text-rose-600" },
    { id: 'critical', title: "عناية مركزة", icon: <Activity size={28} />, color: "from-indigo-500 to-purple-600", bg: "bg-indigo-100/50", text: "text-indigo-600" },
    { id: 'ethics', title: "أخلاقيات مهنة", icon: <ShieldPlus size={28} />, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-100/50", text: "text-emerald-600" },
    { id: 'psych', title: "صحة نفسية", icon: <Brain size={28} />, color: "from-purple-500 to-fuchsia-600", bg: "bg-purple-100/50", text: "text-purple-600" },
    { id: 'pediatric', title: "تمريض أطفال", icon: <Baby size={28} />, color: "from-orange-500 to-amber-600", bg: "bg-orange-100/50", text: "text-orange-600" },
    { id: 'community', title: "صحة مجتمع", icon: <Users size={28} />, color: "from-cyan-500 to-blue-600", bg: "bg-cyan-100/50", text: "text-cyan-600" },
];

export default function InfoSlider({ selected, onSelect }: { selected: string, onSelect: (v: string) => void }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);

    // 1. تحويل بكرة الماوس لتمرير أفقي
    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            const onWheel = (e: WheelEvent) => {
                if (e.deltaY === 0) return;
                e.preventDefault();
                el.scrollTo({
                    left: el.scrollLeft + e.deltaY * 3,
                    behavior: 'auto'
                });
            };
            el.addEventListener('wheel', onWheel, { passive: false });
            return () => el.removeEventListener('wheel', onWheel);
        }
    }, []);

    // 2. منطق السحب (Drag Logic)
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
        const walk = (x - startX) * 1.5;
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollLeft - walk;
            updateProgress();
        }
    };

    const updateProgress = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const progress = (Math.abs(scrollLeft) / (scrollWidth - clientWidth)) * 100;
            setScrollProgress(progress);
        }
    };

    return (
        <section className="w-full mt-12 select-none">
            {/* الهيدر: عنوان القسم مع تلميح السحب */}
            <div className="flex flex-col md:flex-row items-end justify-between px-10 mb-10 gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-2.5 h-14 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-200"></div>
                    <div>
                        <h3 className="font-black text-4xl text-slate-800 tracking-tight">تصفح حسب التخصص</h3>
                        <p className="text-slate-400 font-bold text-sm mt-1">اضغط واسحب لاستكشاف المجالات الطبية ↔️</p>
                    </div>
                </div>

                {/* أزرار تحكم مساعدة (للديسكتوب) */}
                <div className="hidden md:flex gap-3">
                    <button onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })} className="p-3 bg-white border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-90">
                        <ChevronRight size={24} />
                    </button>
                    <button onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })} className="p-3 bg-white border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm active:scale-90">
                        <ChevronLeft size={24} />
                    </button>
                </div>
            </div>

            {/* الحاوية الرئيسية للسكرول */}
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onScroll={updateProgress}
                className={`flex gap-8 overflow-x-auto pb-14 pt-6 no-scrollbar px-10 cursor-grab active:cursor-grabbing scroll-smooth`}
            >
                {slides.map((s) => {
                    const isSelected = selected === s.id;
                    return (
                        <button
                            key={s.id}
                            onClick={() => !isDragging && onSelect(s.id)}
                            className="relative flex-shrink-0 outline-none group"
                        >
                            {/* الكارت الزجاجي (Glassmorphism) */}
                            <div className={`relative w-[260px] h-[280px] rounded-[3rem] border transition-all duration-700 flex flex-col items-center justify-center overflow-hidden
                                ${isSelected
                                    ? `bg-gradient-to-br ${s.color} text-white border-transparent shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] -translate-y-4 scale-105`
                                    : 'bg-white/40 backdrop-blur-xl border-white/80 text-slate-700 hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2'
                                }`}
                            >
                                {/* تأثير الإضاءة الخلفية الناعمة */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-1000 ${isSelected ? 'bg-white/20' : 'bg-blue-400/20'}`}></div>

                                {/* الأيقونة مع تأثير حركة */}
                                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-[10deg]
                                    ${isSelected ? 'bg-white/20 backdrop-blur-md shadow-blue-900/10' : `${s.bg} ${s.text}`}`}>
                                    {s.icon}
                                </div>

                                <h4 className="font-black text-2xl tracking-tight mb-2">{s.title}</h4>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-60 ${isSelected ? 'text-blue-50' : 'text-slate-400'}`}>
                                    Nursing Department
                                </span>

                                {/* علامة الصح للمختار */}
                                {isSelected && (
                                    <div className="absolute top-6 left-6 w-3 h-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]"></div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* شريط التقدم السفلي (نظام تتبع ذكي) */}
            <div className="px-10 max-w-4xl mx-auto">
                <div className="relative h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden border border-white/50 shadow-inner">
                    <div
                        className="absolute right-0 h-full bg-gradient-to-l from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                        style={{ width: `${Math.max(15, scrollProgress)}%` }}
                    ></div>
                </div>
            </div>

            {/* منع ظهور السكرول بار التقليدي */}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -webkit-overflow-scrolling: touch; -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}