'use client'

import { HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'How do I download TikTok videos without watermark?',
    answer:
      'Simply copy the TikTok video link from the app or browser, paste it into the search box above, and click Inspect. Our engine strips watermarks directly and generates high-definition MP4 download links and audio MP3 tracks in seconds.',
  },
  {
    question: 'How to download Facebook videos and FB Reels in HD?',
    answer:
      'Copy the link of any public Facebook video, reel, or watch clip. Paste it into A2Z Downloader to fetch the highest available bitrate MP4 file with clear audio.',
  },
  {
    question: 'Can I download Instagram Reels, Stories, and IGTV videos?',
    answer:
      'Yes. Paste any Instagram reel or post link into our universal engine to stream or download it directly to your device without installing third-party apps.',
  },
  {
    question: 'How does the TeraBox and 1024Tera folder bypass work?',
    answer:
      'Paste your 1024tera, terabox, or sharebox share URL. Our system connects to the sharing handshake, parses folders and files, displays thumbnails and file sizes, and allows you to watch online or download directly.',
  },
  {
    question: 'Can I extract MP3 audio from videos for free?',
    answer:
      'Yes, all audio extraction (MP3 / AAC) is 100% free and unlimited on A2Z Downloader. You can extract crystal-clear sound tracks from any supported video format.',
  },
  {
    question: 'Is A2Z Downloader safe with zero retention?',
    answer:
      'All media is streamed ephemerally through high-speed edge memory. No user files, logs, or history are permanently retained on our servers.',
  },
]

export default function SeoContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="space-y-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-850/60">
      
      {/* Informative SEO Header */}
      <div className="text-center space-y-1.5">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Universal Online Video & Audio Downloader
        </h2>
        <p className="text-xs text-zinc-500 max-w-xl mx-auto leading-relaxed">
          Fast, free, and watermark-free media downloader for TikTok, Facebook, Instagram, TeraBox, Twitter/X, and 1000+ streaming sites.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>TikTok Saver</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            HD MP4 with zero watermark + MP3 audio extraction.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>FB & Insta Reels</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Download Facebook Watch clips, stories, and IG reels in 1080p.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>TeraBox Bypass</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Folder file explorer, direct link generation & online video player.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>100% Free & Safe</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Zero logs, auto-purging memory buffer, no software installation needed.
          </p>
        </div>
      </div>

      {/* SEO FAQ Accordion */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Frequently Asked Questions</span>
        </div>

        <div className="space-y-1.5">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850/40 transition"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in-50 duration-150 border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </section>
  )
}
