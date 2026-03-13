'use client'
import { useState, useEffect } from 'react'
import { Search, BookOpen, GraduationCap, Sparkles, Star, Users, Award, Upload, Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase'

interface HeroProps {
    searchTerm: string;
    onSearch: (value: string) => void;
    selectedType: string;
    onTypeChange: (type: string) => void;
}

export default function HeroSection({ searchTerm, onSearch, selectedType, onTypeChange }: HeroProps) {
    const [deanImage, setDeanImage] = useState<string | null>(null)
    const [deanName, setDeanName] = useState('أ.د. نجلاء بعدالموجود')
    const [deanTitle, setDeanTitle] = useState('عميد كلية التمريض')
    const [deanMessage, setDeanMessage] = useState('نسعى لتخريج كوادر تمريضية متميزة تواكب أحدث المستجدات العلمية.')
    const [siteTitle, setSiteTitle] = useState('كل ما تحتاجه من')
    const [siteSubtitle, setSiteSubtitle] = useState('معرفة وتميز')
    const [heroDescription, setHeroDescription] = useState('المرجع الرقمي الأول لطلاب كلية التمريض جامعة الريادة للعلوم و التكنولوجيا . تصفح آلاف الكتب، الأبحاث، والمصادر الموثوقة بضغطة زر. 🩺')
    const [totalStudents, setTotalStudents] = useState('+٢٠٠٠')
    const [totalBooks, setTotalBooks] = useState('+٥٠٠')
    const [totalTeam, setTotalTeam] = useState('+٣٠')

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('site_settings').select('*').single()
            if (data) {
                if (data.dean_image_url) setDeanImage(data.dean_image_url)
                if (data.dean_name) setDeanName(data.dean_name)
                if (data.dean_title) setDeanTitle(data.dean_title)
                if (data.dean_message) setDeanMessage(data.dean_message)
                if (data.site_title) setSiteTitle(data.site_title)
                if (data.site_subtitle) setSiteSubtitle(data.site_subtitle)
                if (data.hero_description) setHeroDescription(data.hero_description)
                if (data.total_students) setTotalStudents(`+${data.total_students.toLocaleString('ar-EG')}`)
                if (data.total_books) setTotalBooks(`+${data.total_books.toLocaleString('ar-EG')}`)
                if (data.total_researches) setTotalTeam(`+${data.total_researches.toLocaleString('ar-EG')}`)
            }
        }
        fetchSettings()
    }, [])

    return (
        <section className="relative w-full pt-32 md:pt-44 pb-0 px-6 overflow-hidden">

            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-6 items-start">

                <div className="hidden lg:flex flex-col gap-4 animate-in fade-in slide-in-from-right-10 duration-1000">
                    <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-600 via-indigo-500 to-purple-500 rounded-t-[2rem]"></div>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                                <Star size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">نبذة عن الكلية</h3>
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">About Our College</p>
                            </div>
                        </div>

                        <p className="text-slate-500 font-bold text-[12px] leading-[1.9] line-clamp-6">
                            يشهد كل طالب درجة معينة من النمو في كلية التمريض. من المعرفة، إلى مهارات التفكير النقدي، وحتى الذكاء العاطفي. تتحدى كليتنا الطلاب للتفكير النقدي في جميع السيناريوهات لتدريب عقولهم على التفكير مثل الممرضة المحترفة.
                        </p>

                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {[
                                { icon: <Users size={13} />, value: totalStudents, label: 'طالب' },
                                { icon: <BookOpen size={13} />, value: totalBooks, label: 'مرجع' },
                                { icon: <Award size={13} />, value: totalTeam, label: 'أستاذ' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                    <div className="text-blue-600 flex justify-center mb-1">{stat.icon}</div>
                                    <p className="text-sm font-black text-slate-900">{stat.value}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative space-y-4 mb-0  animate-in fade-in slide-in-from-top-10 duration-1000 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="text-blue-500 w-5 h-5 animate-bounce" />
                        <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">Smart Medical Library</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.15] text-center tracking-tight">
                        {siteTitle} <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                            {siteSubtitle}
                        </span> في مكان واحد
                    </h1>

                    <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-bold text-center leading-relaxed">
                        {heroDescription}
                    </p>

                    <div className="w-full max-w-3xl relative group mt-4 transition-all duration-500 hover:scale-[1.01]">
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

                    <div className="flex items-center gap-3 p-2 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl ring-1 ring-slate-200/20 mt-2">
                        {[
                            { key: 'all', label: 'الكل', icon: null, activeClass: 'bg-slate-800 text-white shadow-xl scale-105' },
                            { key: 'book', label: 'كتب علمية', icon: <BookOpen size={18} />, activeClass: 'bg-blue-600 text-white shadow-xl scale-105 shadow-blue-200' },
                            { key: 'research', label: 'أبحاث علمية', icon: <GraduationCap size={18} />, activeClass: 'bg-indigo-600 text-white shadow-xl scale-105 shadow-indigo-200' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                onClick={() => onTypeChange(btn.key)}
                                className={`px-8 py-3.5 rounded-[1.5rem] font-black text-sm transition-all duration-300 flex items-center gap-2
                                    ${selectedType === btn.key ? btn.activeClass : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}
                            >
                                {btn.icon}
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:flex flex-col animate-in fade-in slide-in-from-left-10 duration-1000">
                    <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-blue-400 via-indigo-400 to-purple-400 rounded-t-[2rem] opacity-60"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="mb-4">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">College Dean</p>
                            <h3 className="text-sm font-black text-white">عميد الكلية</h3>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative group mb-4">
                                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                <div className="relative w-36 h-36 rounded-[2rem] overflow-hidden border-2 border-white/20 bg-slate-800">
                                    {deanImage ? (
                                        <img src={deanImage} alt="عميد الكلية" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full">
                                            <Upload size={24} className="text-slate-600 mb-2" />
                                            <span className="text-slate-600 text-[10px] font-black text-center px-2">لا توجد صورة</span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -left-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Award size={10} /> دكتوراه
                                </div>
                            </div>

                            <h4 className="text-base font-black text-white text-center mb-0.5">{deanName}</h4>
                            <p className="text-blue-400 font-black text-[11px] text-center mb-0.5">{deanTitle}</p>
                            <p className="text-slate-500 font-bold text-[10px] text-center">جامعة الريادة للعلوم والتكنولوجيا</p>
                        </div>

                        <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/10">
                            <p className="text-slate-400 font-bold text-[11px] leading-relaxed text-center italic">
                                "{deanMessage}"
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden md:block">
                <div className="w-1 h-12 bg-gradient-to-b from-blue-600 to-transparent rounded-full"></div>
            </div>
        </section>
    );
}