'use client'
import { Search, BookOpen, GraduationCap, Sparkles } from "lucide-react";

interface HeroProps {
    searchTerm: string;
    onSearch: (value: string) => void;
    selectedType: string;
    onTypeChange: (type: string) => void;
}

export default function HeroSection({ searchTerm, onSearch, selectedType, onTypeChange }: HeroProps) {
    return (
        // 👈 pt-40 تضمن عدم التداخل مع الكبسولة والنافبار في الأعلى
        <section className="relative w-full pt-32 md:pt-48 pb-16 px-6 flex flex-col items-center overflow-hidden">

            {/* الخلفية السينمائية: إضاءات ملونة ناعمة خلف المحتوى */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none -z-10 delay-1000"></div>

            {/* العنوان الرئيسي: تصميم ضخم وجذاب */}
            <div className="relative space-y-4 mb-12 animate-in fade-in slide-in-from-top-10 duration-1000">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="text-blue-500 w-5 h-5 animate-bounce" />
                    <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">Smart Medical Library</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.15] text-center tracking-tight">
                    كل ما تحتاجه من <br />
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                        معرفة وتميز
                    </span> في مكان واحد
                </h1>

                <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-bold text-center leading-relaxed">
                    المرجع الرقمي الأول لطلاب وكليات التمريض. تصفح آلاف الكتب،
                    الأبحاث، والمصادر الموثوقة بكبسة زر. 🩺
                </p>
            </div>

            {/* بار البحث: تصميم زجاجي (Glassmorphism) بلمسة تقنية */}
            <div className="w-full max-w-3xl relative group mb-14 transition-all duration-500 hover:scale-[1.01]">
                {/* توهج خلفي يتغير عند التحويم */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-25 transition duration-500"></div>

                <div className="relative flex items-center bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/80 overflow-hidden ring-1 ring-slate-200/50 group-focus-within:ring-blue-500/50">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="ابحث عن عنوان المرجع، اسم الدكتور، أو التخصص..."
                        className="w-full py-6 pr-16 pl-8 bg-transparent text-xl outline-none text-slate-800 placeholder:text-slate-400 font-bold"
                    />
                    <div className="absolute right-6 p-2 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 group-focus-within:rotate-90 transition-transform duration-500">
                        <Search className="w-6 h-6" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* أزرار التبديل (الكبسولة الذكية) */}
            <div className="flex items-center gap-3 p-2 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl ring-1 ring-slate-200/20">
                <button
                    onClick={() => onTypeChange('all')}
                    className={`px-8 py-3.5 rounded-[1.5rem] font-black text-sm transition-all duration-300 flex items-center gap-2
                        ${selectedType === 'all'
                            ? 'bg-slate-800 text-white shadow-xl scale-105'
                            : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}
                >
                    الكل
                </button>

                <button
                    onClick={() => onTypeChange('book')}
                    className={`px-8 py-3.5 rounded-[1.5rem] font-black text-sm transition-all duration-300 flex items-center gap-2
                        ${selectedType === 'book'
                            ? 'bg-blue-600 text-white shadow-xl scale-105 shadow-blue-200'
                            : 'text-slate-600 hover:bg-white/60 hover:text-blue-600'}`}
                >
                    <BookOpen size={18} />
                    كتب علمية
                </button>

                <button
                    onClick={() => onTypeChange('research')}
                    className={`px-8 py-3.5 rounded-[1.5rem] font-black text-sm transition-all duration-300 flex items-center gap-2
                        ${selectedType === 'research'
                            ? 'bg-indigo-600 text-white shadow-xl scale-105 shadow-indigo-200'
                            : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600'}`}
                >
                    <GraduationCap size={18} />
                    أبحاث علمية
                </button>
            </div>

            {/* مؤشر النزول للأسفل (لمسة إضافية) */}
            <div className="absolute bottom-4 animate-bounce opacity-20 hidden md:block">
                <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-transparent rounded-full"></div>
            </div>
        </section>
    );
}