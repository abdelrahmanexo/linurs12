'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'

import Navbar from "@/components/layout/Navbar";
import BookGrid from "@/components/home/BookGrid";

export default function ResearchPage() {
    const [research, setResearch] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchResearch = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('books')
                    .select('*')
                    .eq('type', 'research')
                    .order('created_at', { ascending: false })

                if (data) setResearch(data)
            } finally {
                setLoading(false)
            }
        }
        fetchResearch()
    }, [])

    const filtered = research.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.author.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <main className="w-full min-h-screen bg-transparent font-sans text-slate-900" dir="rtl">
            <Navbar />

            <div className="pt-20 pb-20 space-y-16">
                <section className="px-10">
                    <div className="bg-indigo-600/10 backdrop-blur-xl border border-indigo-200/50 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4 text-right">
                            <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-indigo-200 font-black text-sm">
                                <GraduationCap size={20} />
                                قسم الأبحاث والدراسات
                            </div>
                            <h1 className="text-5xl font-black text-slate-800 leading-tight">
                                المراجع و <span className="text-indigo-600">الأبحاث العلمية</span>
                            </h1>
                            <p className="text-slate-500 font-bold max-w-xl">
                                هنا تجد أحدث الأوراق البحثية، رسائل الماجستير، والمراجع الأكاديمية الموثوقة لطلاب التمريض.
                            </p>
                        </div>

                        <div className="w-full max-w-md relative group">
                            <div className="absolute -inset-1 bg-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative flex items-center bg-white/80 backdrop-blur-xl rounded-2xl border border-indigo-100">
                                <input
                                    type="text"
                                    placeholder="ابحث في الأبحاث..."
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full py-4 pr-12 pl-4 bg-transparent outline-none font-bold"
                                />
                                <Search className="absolute right-4 text-indigo-500 w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-10 px-6">
                    <div className="flex items-center justify-between px-10">
                        <h3 className="text-2xl font-black text-slate-800">نتائج البحث في الأكاديميا</h3>
                        <Link href="/" className="text-indigo-600 font-bold flex items-center gap-2 hover:underline">
                            العودة للرئيسية <ArrowRight size={18} />
                        </Link>
                    </div>

                    <BookGrid books={filtered} loading={loading} />
                </div>
            </div>
        </main>
    );
}