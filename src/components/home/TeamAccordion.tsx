'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Award, GraduationCap, BookOpen, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const COLORS = [
    'from-blue-600 to-indigo-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700',
    'from-violet-600 to-purple-700',
    'from-cyan-600 to-sky-700',
]

interface Book {
    id: string
    title: string
    author: string
    cover_url: string
    file_url: string
    page_count: number
    type: string
}

interface TeamMember {
    id: string
    name: string
    title: string
    specialty: string
    image_url: string
    message: string
    order: number
    books: Book[]
}

function MemberModal({ member, colorClass, onClose }: {
    member: TeamMember
    colorClass: string
    onClose: () => void
}) {
    const router = useRouter()

    const openBook = (book: Book) => {
        const params = new URLSearchParams({
            file: book.file_url,
            title: book.title,
        })
        router.push(`/reader?${params.toString()}`)
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', handler)
            document.body.style.overflow = ''
        }
    }, [onClose])

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                dir="rtl"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative h-52 flex-shrink-0">
                    <img
                        src={member.image_url || '/team/placeholder.jpg'}
                        alt={member.name}
                        className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${colorClass} mix-blend-multiply opacity-50`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute left-4 top-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="absolute bottom-0 right-0 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <GraduationCap size={16} className="text-white/70" />
                            <span className="text-white/70 text-sm font-bold">{member.specialty}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white">{member.name}</h3>
                        <p className="text-blue-300 font-bold text-sm mt-1">{member.title}</p>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    {member.message && (
                        <div className="bg-blue-50 border-r-4 border-blue-500 rounded-2xl p-4 mb-6">
                            <p className="text-sm text-slate-600 font-bold leading-relaxed italic">
                                "{member.message}"
                            </p>
                        </div>
                    )}

                    {member.books.length > 0 ? (
                        <>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                مراجع الدكتور ({member.books.length})
                            </p>
                            <div className="space-y-3">
                                {member.books.map(book => (
                                    <button
                                        key={book.id}
                                        onClick={() => openBook(book)}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group text-right"
                                    >
                                        <div className="w-10 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                                            {book.cover_url
                                                ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                                : <BookOpen className="m-auto mt-3 text-slate-400" size={18} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 text-sm truncate">{book.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${book.type === 'book' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                    {book.type === 'book' ? 'كتاب' : 'بحث'}
                                                </span>
                                                {book.page_count > 0 && (
                                                    <span className="text-xs text-slate-400 font-bold">{book.page_count} صفحة</span>
                                                )}
                                            </div>
                                        </div>
                                        <BookOpen size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="font-bold text-sm">لا توجد مراجع مرتبطة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function TeamAccordion() {
    const [active, setActive] = useState(0)
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

    useEffect(() => {
        const fetchTeam = async () => {
            const { data: teamData } = await supabase
                .from('team')
                .select('*')
                .order('order', { ascending: true })

            if (!teamData) { setLoading(false); return }

            const { data: tbData } = await supabase
                .from('team_books')
                .select('team_id, book_id')

            const allBookIds = [...new Set(tbData?.map(tb => tb.book_id) || [])]
            let booksMap: Record<string, Book> = {}

            if (allBookIds.length > 0) {
                const { data: booksData } = await supabase
                    .from('books')
                    .select('*')
                    .in('id', allBookIds)

                booksData?.forEach(b => { booksMap[String(b.id)] = b })
            }

            const enriched: TeamMember[] = teamData.map(member => {
                const memberBookIds = tbData
                    ?.filter(tb => tb.team_id === member.id)
                    .map(tb => String(tb.book_id)) || []

                return {
                    ...member,
                    books: memberBookIds.map(bid => booksMap[bid]).filter(Boolean)
                }
            })

            setTeam(enriched)
            setLoading(false)
        }

        fetchTeam()
    }, [])

    if (loading) return (
        <section className="w-full py-24 px-10 flex items-center justify-center h-[700px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold">جاري تحميل الكوادر...</p>
            </div>
        </section>
    )

    if (team.length === 0) return null

    return (
        <>
            <section className="w-full py-24 px-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/20 blur-[120px] rounded-full -z-10" />

                <div className="flex flex-col items-center text-center mb-16">
                    <div className="flex items-center gap-3 mb-4 px-6 py-2 bg-white/50 backdrop-blur-xl border border-white rounded-full shadow-sm">
                        <Award className="text-blue-600 w-5 h-5" />
                        <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Scientific Board</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                        نخبة الكوادر القائمة <br /> على <span className="text-blue-600">النشر العلمي</span>
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 h-[550px] w-full max-w-7xl mx-auto">
                    {team.map((member, index) => (
                        <div
                            key={member.id}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => setSelectedMember(member)}
                            className={`relative h-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer overflow-hidden rounded-[3rem] border border-white shadow-2xl group
                            ${active === index ? 'flex-[4]' : 'flex-[1] opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
                        >
                            <img
                                src={member.image_url || '/team/placeholder.jpg'}
                                alt={member.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />

                            <div className={`absolute inset-0 bg-gradient-to-t ${COLORS[index % COLORS.length]} mix-blend-multiply opacity-40`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            <div className={`absolute bottom-0 right-0 p-10 w-full transition-all duration-500
                                ${active === index ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 md:group-hover:opacity-100 md:group-hover:translate-y-0'}`}>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
                                        <GraduationCap size={20} />
                                    </div>
                                    <span className="text-white/80 font-bold text-sm">{member.specialty}</span>
                                </div>

                                <h3 className="text-3xl font-black text-white mb-2">{member.name}</h3>
                                <p className="text-blue-400 font-bold text-lg mb-6">{member.title}</p>

                                {active === index && (
                                    <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                                        {member.message && (
                                            <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-md font-medium">
                                                {member.message}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4">
                                            {member.books.length > 0 && (
                                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                                                    <BookOpen size={16} className="text-white/70" />
                                                    <span className="text-white font-black text-sm">{member.books.length} مرجع</span>
                                                </div>
                                            )}
                                            <span className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform">
                                                عرض الملف الشخصي 👤
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {active !== index && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="rotate-90 text-white font-black text-2xl whitespace-nowrap opacity-40 uppercase tracking-[0.3em]">
                                        {member.name.split(' ')[1] || member.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {selectedMember && (
                <MemberModal
                    member={selectedMember}
                    colorClass={COLORS[team.indexOf(selectedMember) % COLORS.length]}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </>
    )
}