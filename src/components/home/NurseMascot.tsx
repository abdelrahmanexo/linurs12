'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const messages = [
  "أهلاً وسهلاً! 👋 أنا نورا، ممرضتك الرقمية!",
  "ابحث عن أي مرجع طبي وأنا هساعدك! 📚",
  "عندنا آلاف الكتب والأبحاث في انتظارك 🩺",
  "صحتك وتعليمك أهم حاجة عندنا! 💙",
  "هل تحتاج مساعدة في البحث؟ ✨",
]

export default function NurseMascot() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true)
      setTimeout(() => setOpen(true), 700)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return
    const i = setInterval(() => setMsgIndex(m => (m + 1) % messages.length), 4000)
    return () => clearInterval(i)
  }, [open])

  useEffect(() => {
    const i = setInterval(() => {
      setBounce(true)
      setTimeout(() => setBounce(false), 700)
    }, 5000)
    return () => clearInterval(i)
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:.7; }
          100% { transform:scale(1.8); opacity:0;  }
        }
        @keyframes msgSlide {
          0%   { opacity:0; transform: translateX(-8px); }
          100% { opacity:1; transform: translateX(0); }
        }
        .nurse-float {
          animation: float 3.5s ease-in-out infinite;
        }
      `}</style>

      <div
        dir="rtl"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
          fontFamily: 'Tajawal, Cairo, sans-serif',
        }}
      >
        {open && (
          <div style={{
            background: 'white',
            border: '2px solid #2563eb',
            borderRadius: '18px 18px 18px 4px',
            padding: '12px 16px',
            maxWidth: '220px',
            boxShadow: '0 8px 32px rgba(37,99,235,.2)',
            animation: 'fadeUp .4s ease',
            position: 'relative',
          }}>
            <span style={{
              position:'absolute', top:'-5px', right:'-5px',
              width:'11px', height:'11px', borderRadius:'50%',
              background:'#2563eb', display:'inline-block',
            }}/>
            <span style={{
              position:'absolute', top:'-5px', right:'-5px',
              width:'11px', height:'11px', borderRadius:'50%',
              background:'#2563eb', display:'inline-block',
              animation:'pulse-ring 1.5s ease-out infinite',
            }}/>

            <p
              key={msgIndex}
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 700,
                color: '#1e293b',
                lineHeight: 1.7,
                textAlign: 'right',
                animation: 'msgSlide .35s ease',
              }}
            >
              {messages[msgIndex]}
            </p>

            <button
              onClick={() => setOpen(false)}
              style={{
                position:'absolute', top:'-11px', left:'-11px',
                width:'22px', height:'22px', borderRadius:'50%',
                background:'#ef4444', color:'white',
                border:'none', cursor:'pointer',
                fontSize:'13px', fontWeight:'bold',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 8px rgba(239,68,68,.4)',
              }}
            >×</button>
          </div>
        )}

        <div
          onClick={() => setOpen(o => !o)}
          className={!bounce ? 'nurse-float' : undefined}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            filter: 'drop-shadow(0 8px 24px rgba(37,99,235,.25))',
            transform: bounce ? 'translateY(-16px)' : undefined,
            transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <Image
            src="/nurse-mascot.png"
            alt="نورا - الممرضة الرقمية"
            width={130}
            height={150}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </>
  )
}
