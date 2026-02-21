'use client'
import { useState } from 'react'
import Link from 'next/link' // 👈 استيراد مكون الروابط
import { Award, Mail, Linkedin, GraduationCap } from 'lucide-react'

// مصفوفة البيانات مع أسماء الصور المحلية
const team = [
    {
        id: 1,
        slug: "sarah-mansour", // معرف نصي للرابط
        name: "د. سارة المنصوري",
        role: "عميد كلية التمريض",
        dept: "قسم الإدارة والقيادة",
        image: "/team/doctor-1.jpg", // 👈 اسم الصورة في مجلد public/team/
        bio: "خبيرة في تطوير المناهج الرقمية للعلوم الطبية وأشرفت على نشر أكثر من 50 مرجعاً علمياً.",
        color: "from-blue-600 to-indigo-700"
    },
    {
        id: 2,
        slug: "mohammed-qahtani",
        name: "د. محمد القحطاني",
        role: "رئيس لجنة النشر العلمي",
        dept: "قسم التمريض الباطني والجراحي",
        image: "/team/doctor-2.jpg", // 👈 اسم الصورة في مجلد public/team/
        bio: "متخصص في مراجعة الأبحاث السريرية وتدقيق المصادر العلمية لضمان جودة المحتوى الأكاديمي.",
        color: "from-emerald-600 to-teal-700"
    },
    {
        id: 3,
        slug: "layla-hassan",
        name: "د. ليلى حسن",
        role: "منسق المراجع الرقمية",
        dept: "قسم تمريض الأمومة والطفولة",
        image: "/team/doctor-3.jpg", // 👈 اسم الصورة في مجلد public/team/
        bio: "قامت بتحويل المكتبة الورقية إلى نظام رقمي متكامل لخدمة طلاب الدراسات العليا.",
        color: "from-rose-600 to-pink-700"
    },
    {
        id: 4,
        slug: "ibrahim-fouad",
        name: "أ.د. إبراهيم فؤاد",
        role: "مستشار تكنولوجيا التعليم",
        dept: "قسم الصحة النفسية",
        image: "/team/doctor-4.jpg", // 👈 اسم الصورة في مجلد public/team/
        bio: "مطور أنظمة القراءة الآمنة والمسؤول عن دمج الذكاء الاصطناعي في البحث العلمي.",
        color: "from-amber-600 to-orange-700"
    }
]

export default function TeamAccordion() {
    const [active, setActive] = useState(0)

    return (
        <section className="w-full py-24 px-10 relative overflow-hidden">
            {/* الخلفية الجمالية */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/20 blur-[120px] rounded-full -z-10"></div>

            {/* العنوان */}
            <div className="flex flex-col items-center text-center mb-16">
                <div className="flex items-center gap-3 mb-4 px-6 py-2 bg-white/50 backdrop-blur-xl border border-white rounded-full shadow-sm">
                    <Award className="text-blue-600 w-5 h-5" />
                    <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Scientific Board</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                    نخبة الكوادر القائمة <br /> على <span className="text-blue-600">النشر العلمي</span>
                </h2>
            </div>

            {/* حاوية الأكورديون الأفقي */}
            <div className="flex flex-col md:flex-row gap-4 h-[550px] w-full max-w-7xl mx-auto">
                {team.map((member, index) => (
                    // 👈 تغليف الكارت برابط للانتقال لصفحة الصور
                    <Link
                        key={member.id}
                        href={`/staff/${member.slug}`} // التوجه لصفحة الدكتور (مثلاً: /staff/sarah-mansour)
                        onMouseEnter={() => setActive(index)}
                        className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] cursor-pointer overflow-hidden rounded-[3rem] border border-white shadow-2xl group
                        ${active === index ? 'flex-[4]' : 'flex-[1] opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
                    >
                        {/* صورة الكادر */}
                        <img
                            src={member.image}
                            alt={member.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />

                        {/* طبقات الظلال والتدرج */}
                        <div className={`absolute inset-0 bg-gradient-to-t ${member.color} mix-blend-multiply opacity-40`}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                        {/* المحتوى النصي */}
                        <div className={`absolute bottom-0 right-0 p-10 w-full transition-all duration-500 ${active === index ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0'}`}>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
                                    <GraduationCap size={20} />
                                </div>
                                <span className="text-white/80 font-bold text-sm">{member.dept}</span>
                            </div>

                            <h3 className="text-3xl font-black text-white mb-2">{member.name}</h3>
                            <p className="text-blue-400 font-bold text-lg mb-6">{member.role}</p>

                            {active === index && (
                                <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                                    <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md font-medium">
                                        {member.bio}
                                    </p>

                                    {/* زر عرض معرض الصور */}
                                    <div className="flex items-center gap-4">
                                        <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform">
                                            عرض معرض الصور 📸
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* الاسم الرأسي يظهر عندما تكون البطاقة منكمشة */}
                        {active !== index && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="rotate-90 text-white font-black text-2xl whitespace-nowrap opacity-40 uppercase tracking-[0.3em]">
                                    {member.name.split(' ')[1]}
                                </span>
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </section>
    )
}