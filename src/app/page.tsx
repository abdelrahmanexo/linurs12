'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// استيراد المكونات العالمية
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import InfoSlider from "@/components/home/InfoSlider";
import BookGrid from "@/components/home/BookGrid";
import TeamAccordion from "@/components/home/TeamAccordion"; // 👈 المكون الجديد

// 1. تعريف الهيكل البياني للمراجع (Type Safety)
interface MedicalResource {
  id: string;
  title: string;
  author: string;
  category: string;
  type: 'book' | 'research';
  cover_url?: string;
  file_url: string;
  page_count?: number;
  created_at: string;
}

export default function Home() {
  // 2. حالات النظام (State Management)
  const [books, setBooks] = useState<MedicalResource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(true)

  // 3. جلب البيانات من Supabase مع معالجة الأخطاء الاحترافية
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBooks(data || [])
    } catch (error: any) {
      console.error("Critical Database Error:", error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  // 4. محرك الفلترة الذكي (Optimized with useMemo)
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const title = book.title?.toLowerCase() || ''
      const author = book.author?.toLowerCase() || ''
      const search = searchTerm.toLowerCase()

      const matchesSearch = title.includes(search) || author.includes(search)
      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
      const matchesType = selectedType === 'all' || book.type === selectedType

      return matchesSearch && matchesCategory && matchesType
    })
  }, [books, searchTerm, selectedCategory, selectedType])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedType('all')
  }

  return (
    <main className="w-full min-h-screen bg-transparent font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white" dir="rtl">

      {/* 1. الهيدر العائم العالمي */}
      <Navbar />

      {/* 2. منطقة المحتوى (تنظيم المسافات لتجنب التصادم) */}
      <div className="w-full flex flex-col space-y-32 pb-20">

        {/* قسم الهيرو: البحث والتحكم في النوع */}
        <HeroSection
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />

        {/* قسم التخصصات: التصفح العرضي الذكي */}
        <section className="relative z-10 w-full animate-in fade-in duration-1000">
          <InfoSlider selected={selectedCategory} onSelect={setSelectedCategory} />
        </section>

        {/* منطقة عرض النتائج والكتب */}
        <div className="container mx-auto px-6 md:px-10 space-y-16 relative z-10">

          {/* بار النتائج المتطور */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-200/60 pb-12">
            <div className="flex items-center gap-6">
              <div className="w-2.5 h-16 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-full shadow-[0_0_25px_rgba(37,99,235,0.4)] animate-pulse"></div>
              <div>
                <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
                  {selectedType === 'research' ? 'الأبحاث العلمية الموثقة' :
                    selectedType === 'book' ? 'الكتب والمراجع الأكاديمية' : 'أحدث مراجع المكتبة'}
                </h3>
                <p className="text-slate-500 font-bold text-lg mt-3 flex items-center gap-2">
                  تصفح أفضل المصادر الطبية الموثوقة لطلاب التمريض 🩺
                </p>
              </div>
            </div>

            {/* عداد النتائج الزجاجي */}
            <div className="bg-white/40 backdrop-blur-2xl px-10 py-5 rounded-[2rem] border border-white shadow-2xl flex flex-col items-center min-w-[180px]">
              <span className="text-blue-600 font-black text-4xl leading-none">
                {loading ? '...' : filteredBooks.length}
              </span>
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-2">مرجع متاح حالياً</span>
            </div>
          </div>

          {/* شبكة الكتب أو حالة "لا توجد نتائج" */}
          {loading ? (
            <BookGrid books={[] as any} loading={true} />
          ) : filteredBooks.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <BookGrid books={filteredBooks as any} loading={false} />
            </div>
          ) : (
            /* Empty State: تصميم احترافي عند انعدام النتائج */
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white/20 backdrop-blur-md rounded-[4rem] border-4 border-dashed border-slate-200/50 mx-4">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-5xl animate-bounce italic text-slate-300">!</div>
              <div>
                <h4 className="text-3xl font-black text-slate-700">عذراً، لم نجد ما تبحث عنه</h4>
                <p className="text-slate-500 font-bold text-lg mt-2 italic">جرب استخدام كلمات بحث مختلفة أو تغيير الفلاتر</p>
              </div>
              <button
                onClick={resetFilters}
                className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
              >
                إعادة ضبط البحث
              </button>
            </div>
          )}
        </div>

        {/* قسم الكوادر التعليمية (الأكورديون العالمي) */}
        <section className="w-full pt-10">
          <TeamAccordion />
        </section>

      </div>

      {/* لمسة نهائية: ظلال سينمائية في قاع الصفحة */}
      <div className="fixed bottom-0 left-0 w-full h-96 bg-gradient-to-t from-white via-white/40 to-transparent pointer-events-none z-0"></div>
    </main>
  );
}