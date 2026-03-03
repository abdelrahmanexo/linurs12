'use client'
import { useState } from 'react'
import { Upload, Award, BookOpen, Users, Star, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AboutSection() {
    const [deanImage, setDeanImage] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const fileId = Math.random().toString(36).substring(7)
            const { error } = await supabase.storage
                .from('nursing-books')
                .upload(`dean/dean_${fileId}.webp`, file)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage
                .from('nursing-books')
                .getPublicUrl(`dean/dean_${fileId}.webp`)
            setDeanImage(publicUrl)
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    const stats = [
        { icon: <Users size={20} />, value: '+٢٠٠٠', label: 'طالب وطالبة' },
        { icon: <BookOpen size={20} />, value: '+٥٠٠', label: 'مرجع علمي' },
        { icon: <Award size={20} />, value: '+٣٠', label: 'عضو هيئة تدريس' },
    ]

    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-20" dir="rtl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* ===== الجانب الأيمن: نبذة عن الكلية ===== */}
                <div className="relative bg-white/60 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_30px_80px_rgba(0,0,0,0.06)] p-10 overflow-hidden">
                    {/* شريط لوني علوي */}
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-blue-600 via-indigo-500 to-purple-500 rounded-t-[3rem]"></div>

                    {/* زخرفة خلفية */}
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                    {/* العنوان */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Star size={22} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">نبذة عن الكلية</h2>
                            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-0.5">About Our College</p>
                        </div>
                    </div>

                    {/* النص */}
                    <div className="space-y-5 text-slate-600 font-bold text-[15px] leading-[2] mb-10">
                        <p>
                            يشهد كل طالب درجة معينة من النمو في كلية التمريض. من المعرفة، إلى مهارات التفكير النقدي، وحتى الذكاء العاطفي. تتحدى كليتنا الطلاب للتفكير النقدي في جميع السيناريوهات لتدريب عقولهم على التفكير مثل الممرضة المحترفة.
                        </p>
                        <p>
                            ينمي طلاب التمريض ذكاءهم العاطفي من خلال أعضاء هيئة التدريس حيث يواجهون تجارب جديدة وتفاعلات مع المرضى. يحتاج الجميع إلى الدعم في مرحلة ما، وطاقم العمل وأعضاء هيئة التدريس هنا من أجلك دائماً.
                        </p>
                        <p>
                            توفر مختبرات المحاكاة فرصاً لممارسة المهارات والتقييمات لبناء معرفتك وخبرتك قبل تطبيقها على المرضى. <span className="text-blue-600">تذكر، تخرج من الكلية ما وضعته فيها!</span>
                        </p>
                    </div>

                    {/* الإحصائيات */}
                    <div className="grid grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-slate-50/80 rounded-[1.5rem] p-4 text-center border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                                <div className="text-blue-600 flex justify-center mb-2 group-hover:scale-110 transition-transform">
                                    {stat.icon}
                                </div>
                                <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== الجانب الأيسر: عميد الكلية ===== */}
                <div className="relative bg-gradient-to-br from-slate-900 to-blue-950 rounded-[3rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.15)] p-10 overflow-hidden flex flex-col">
                    {/* زخارف خلفية */}
                    <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-blue-400 via-indigo-400 to-purple-400 rounded-t-[3rem] opacity-50"></div>

                    {/* العنوان */}
                    <div className="relative z-10 mb-8">
                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-1">College Dean</p>
                        <h2 className="text-2xl font-black text-white">عميد الكلية</h2>
                    </div>

                    {/* صورة العميد */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                        <div className="relative group mb-8">
                            {/* الإطار المضيء */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-[2.5rem] blur opacity-40 group-hover:opacity-60 transition-opacity"></div>

                            <div className="relative w-52 h-52 rounded-[2.5rem] overflow-hidden border-2 border-white/20 bg-slate-800">
                                {deanImage ? (
                                    <img src={deanImage} alt="عميد الكلية" className="w-full h-full object-cover" />
                                ) : (
                                    <label htmlFor="dean-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-slate-700 transition-colors">
                                        <Upload size={32} className="text-slate-400 mb-3" />
                                        <span className="text-slate-400 text-xs font-black text-center px-4">
                                            {uploading ? 'جاري الرفع...' : 'رفع صورة العميد'}
                                        </span>
                                        <input id="dean-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>

                            {/* بادج الدكتوراه */}
                            <div className="absolute -bottom-3 -left-3 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-blue-900/50 flex items-center gap-1">
                                <Award size={12} />
                                دكتوراه
                            </div>
                        </div>

                        {/* معلومات العميد */}
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white mb-1">أ.د. محمد أحمد السيد</h3>
                            <p className="text-blue-400 font-black text-sm mb-1">عميد كلية التمريض</p>
                            <p className="text-slate-400 font-bold text-xs">جامعة الريادة للعلوم والتكنولوجيا</p>
                        </div>

                        {/* تغيير الصورة لو موجودة */}
                        {deanImage && (
                            <label htmlFor="dean-upload-change" className="mt-5 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black cursor-pointer transition-colors">
                                <Upload size={14} />
                                تغيير الصورة
                                <input id="dean-upload-change" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* اقتباس */}
                    <div className="relative z-10 mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                        <p className="text-slate-300 font-bold text-sm leading-relaxed text-center italic">
                            "نسعى لتخريج كوادر تمريضية متميزة تواكب أحدث المستجدات العلمية وتخدم المجتمع بإخلاص ومهنية."
                        </p>
                    </div>
                </div>

            </div>
        </section>
    )
}