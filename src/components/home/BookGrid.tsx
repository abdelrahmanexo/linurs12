'use client'
import Link from 'next/link'
import { Calendar, FileText, User, ExternalLink, Hash } from 'lucide-react'

export default function BookGrid({ books, loading }: { books: any[], loading: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-10 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="aspect-[3/4] bg-blue-100/20 rounded-2xl border border-white/20"></div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 px-10 pb-24">
      {books.map((book) => (
        <div key={book.id} className="group relative flex flex-col bg-white/40 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
          
          {/* قسم الغلاف - مربع تماماً (Aspect Square) */}
          <div className="relative aspect-square w-full overflow-hidden border-b border-white/20">
            {book.cover_url ? (
              <img 
                src={book.cover_url} 
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <FileText size={48} className="text-slate-400" />
              </div>
            )}
            
            {/* زر القراءة السريعة العائم */}
            <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <Link 
                href={`/reader?file=${encodeURIComponent(book.file_url)}&title=${encodeURIComponent(book.title)}`} 
                className="bg-white text-blue-900 px-8 py-3 rounded-xl font-black text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
              >
                فتح المرجع 📖
              </Link>
            </div>
          </div>

          {/* محتوى بيانات الكتاب المنسق */}
          <div className="p-6 flex flex-col flex-grow">
            <h2 className="text-xl font-black text-slate-800 mb-3 line-clamp-2 min-h-[56px] leading-snug">
              {book.title}
            </h2>
            
            <div className="space-y-3 mb-6">
              {/* المؤلف */}
              <div className="flex items-center gap-2 text-slate-500">
                <User size={14} className="text-blue-600" />
                <span className="text-sm font-bold">د. {book.author}</span>
              </div>
              
              {/* البيانات الفنية (التاريخ والصفحات) */}
              <div className="flex items-center gap-4 border-t border-white/20 pt-3">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={14} />
                  <span className="text-xs font-black">{new Date(book.created_at).getFullYear()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Hash size={14} />
                  <span className="text-xs font-black">{book.page_count || '??'} صفحة</span>
                </div>
              </div>
            </div>

            {/* الزر السفلي */}
            <Link 
              href={`/reader?file=${encodeURIComponent(book.file_url)}&title=${encodeURIComponent(book.title)}`} 
              className="mt-auto flex items-center justify-between w-full bg-blue-600/10 hover:bg-blue-600 text-blue-700 hover:text-white px-5 py-3 rounded-xl font-black text-sm transition-all group/btn"
            >
              تصفح المرجع
              <ExternalLink size={16} className="group-hover/btn:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}