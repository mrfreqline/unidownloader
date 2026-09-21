'use client'

import { useState } from 'react'
import {
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  Video,
  Music,
  Scissors,
  Image as ImageIcon,
  FolderDown,
  ShieldCheck,
  Sparkles,
  Zap,
  Play,
  Layers,
  ArrowRight,
  Globe,
  Sliders,
  Check,
} from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'What is A2Z Downloader?',
    answer:
      'A2Z Downloader is a free online all-in-one media downloader that brings multiple download tools together in one place. Download videos and audio from supported platforms including YouTube, TikTok, Facebook, Instagram, TeraBox and ShareBox. Choose available video quality and audio options such as 128kbps, 192kbps, 320kbps and Studio HD, download MP3 or MP4, save photos and thumbnails, create custom MP3 or MP4 clips using start and end times, and stream supported media directly online.',
  },
  {
    question: 'How do I download TikTok videos without watermark?',
    answer:
      'Copy the TikTok video link from the TikTok mobile app or web browser, paste it into the A2Z Downloader search box, and click Inspect. Our engine strips watermarks automatically and delivers crystal-clear Full HD MP4 downloads alongside high-bitrate MP3 audio extraction and photo slideshow downloads.',
  },
  {
    question: 'Can I download Instagram Reels, Videos, Photos, and Carousels?',
    answer:
      'Yes! A2Z Downloader fully supports Instagram Reels, standard feed videos, high-resolution photo posts, IGTV, and multi-slide carousel albums. You can inspect any Instagram post to download individual images, albums, or HD video clips with zero compression.',
  },
  {
    question: 'How do I download Facebook videos and FB Reels in 1080p HD?',
    answer:
      'Copy the URL of any public Facebook video, Watch clip, story, or Facebook Reel. Paste the link into A2Z Downloader and select your preferred MP4 resolution up to 1080p Full HD. You can also extract the audio track directly as an MP3 file.',
  },
  {
    question: 'How do I download YouTube videos and convert to 320kbps MP3 audio?',
    answer:
      'Paste any YouTube video or Shorts URL into the input field. A2Z Downloader allows you to download video in resolutions from 360p, 480p, 720p, 1080p up to 4K MP4. If you only want the sound, switch to Audio mode to extract studio-quality MP3 at 128kbps, 192kbps, or 320kbps Studio HD bitrate.',
  },
  {
    question: 'How does TeraBox and ShareBox direct download bypass work?',
    answer:
      'Paste any TeraBox, 1024Tera, or ShareBox link into A2Z Downloader. Our platform connects to the file sharing handshake, parses the folder contents and file sizes, and generates direct download links at maximum bandwidth. You can even stream videos directly in your browser without installing the TeraBox application.',
  },
  {
    question: 'Can I cut or trim custom video or audio clips before downloading?',
    answer:
      'Yes! A2Z Downloader features a built-in Media Enhancer that allows you to specify custom start and end timestamps. You can clip a 30-second music ringtone from a long song or isolate an exact highlight section from an hour-long video without downloading the entire large file.',
  },
  {
    question: 'What video qualities and audio bitrates are supported?',
    answer:
      'For video, A2Z Downloader provides MP4 downloads in 360p, 480p, 720p HD, 1080p Full HD, and 4K UHD depending on the source platform. For audio, you can choose flexible MP3 bitrates including 128kbps (standard), 192kbps (high fidelity), and 320kbps (Studio HD audio).',
  },
  {
    question: 'Can I download photo posts and video thumbnails?',
    answer:
      'Yes. You can download high-resolution cover photos, video thumbnails (including original YouTube maximum-resolution thumbnails), TikTok photo carousels, and Instagram photo posts directly in JPEG and PNG formats.',
  },
  {
    question: 'Can I stream and preview videos before downloading?',
    answer:
      'A2Z Downloader includes an integrated in-browser video and audio player. You can preview, listen to, or stream media directly before committing to a download, ensuring you get the exact content and quality you want.',
  },
  {
    question: 'Do I need to install software, browser extensions, or create an account?',
    answer:
      'No! A2Z Downloader is 100% web-based and runs entirely in your modern browser on Android, iPhone, iPad, Windows PC, Mac, and Linux. No software installation, browser extensions, or account registration are required.',
  },
  {
    question: 'Is A2Z Downloader safe, private, and free to use?',
    answer:
      'A2Z Downloader is completely free to use. All media requests are processed ephemerally with zero permanent file retention on our servers. Your downloads and browsing sessions remain strictly private and secure.',
  },
]

const PLATFORM_FEATURES = [
  {
    title: 'YouTube Downloader & MP3',
    icon: Video,
    color: 'text-red-500',
    bg: 'bg-red-500/10 dark:bg-red-500/15',
    border: 'border-red-500/20',
    description:
      'Download YouTube videos in 4K, 1080p, 720p MP4. Convert YouTube to 320kbps MP3 audio, download thumbnails, or trim custom video & audio clips.',
    tags: ['4K / 1080p MP4', '320kbps Studio MP3', 'Thumbnails', 'Clip Cutter'],
  },
  {
    title: 'TikTok Saver (No Watermark)',
    icon: Sparkles,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500/20',
    description:
      'Download TikTok videos without watermark in HD MP4. Extract original TikTok sounds, trending background music, and photo slideshow albums.',
    tags: ['No Watermark', 'HD MP4', 'TikTok Sounds MP3', 'Photo Slides'],
  },
  {
    title: 'Instagram Reels & Photos',
    icon: Layers,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    border: 'border-pink-500/20',
    description:
      'Save Instagram Reels, videos, IGTV, and high-resolution photo posts. Full support for multi-image carousel albums with single-click downloads.',
    tags: ['Instagram Reels', 'Carousels', 'High-Res Photos', '1080p Video'],
  },
  {
    title: 'Facebook Video & Reels',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-500/20',
    description:
      'Download Facebook Watch videos, public FB Reels, stories, and clips in 1080p Full HD MP4. Clear audio and fast direct streaming.',
    tags: ['FB Reels', 'Watch Videos', '1080p Full HD', 'MP3 Audio'],
  },
  {
    title: 'TeraBox & ShareBox Direct',
    icon: FolderDown,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/20',
    description:
      'Direct link generator and folder explorer for TeraBox, 1024Tera, and ShareBox. Bypass app download caps, inspect files, and stream online.',
    tags: ['Folder Explorer', 'Direct Download', 'Stream Online', 'No App Needed'],
  },
  {
    title: 'Studio HD Audio & MP3 Converter',
    icon: Music,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20',
    description:
      'Universal audio extractor with flexible bitrate options: 128kbps, 192kbps, and Studio HD 320kbps. Convert any video to crystal-clear music tracks.',
    tags: ['320kbps MP3', 'Studio HD Audio', 'Audio Trimmer', 'Universal Format'],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Copy Media URL',
    desc: 'Copy the link of any video, reel, song, photo, or folder from YouTube, TikTok, Facebook, Instagram, or TeraBox.',
  },
  {
    step: '02',
    title: 'Paste & Inspect',
    desc: 'Paste the URL into the A2Z Downloader input field above and click "Inspect" to parse formats and resolutions.',
  },
  {
    step: '03',
    title: 'Select Quality or Trim',
    desc: 'Choose your desired MP4 resolution (up to 4K), 320kbps MP3 bitrate, or set start and end times for custom clips.',
  },
  {
    step: '04',
    title: 'Download or Stream',
    desc: 'Click Download to save the file directly to your phone or computer, or preview it instantly with our in-browser player.',
  },
]

const KEYWORD_TOPIC_PILLS = [
  'All Video Downloader',
  'YouTube to MP3 320kbps',
  'TikTok Without Watermark',
  'Instagram Reel Saver',
  'Facebook 1080p HD',
  'TeraBox Direct Bypass',
  'ShareBox File Downloader',
  'Studio HD Audio',
  'Custom Video Clips',
  'Audio Trimmer & Cutter',
  'Photo & Thumbnail Saver',
  'Online Video Streamer',
  'Free MP4 Downloader',
  'No Software Needed',
]

export default function SeoContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="space-y-10 pt-8 pb-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
      
      {/* 1. Primary SEO Brand Header & 0.2 Extended SEO Description */}
      <div className="text-center space-y-3 max-w-3xl mx-auto px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3 h-3" />
          <span>Complete Media Solution</span>
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
          A2Z Downloader – Free Online Video, Audio, MP3 & MP4 Downloader
        </h2>

        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
          A2Z Downloader is a free online all-in-one media downloader that brings multiple download tools together in one place. Download videos and audio from supported platforms including YouTube, TikTok, Facebook, Instagram, TeraBox and ShareBox. Choose available video quality and audio options such as 128kbps, 192kbps, 320kbps and Studio HD, download MP3 or MP4, save photos and thumbnails, create custom MP3 or MP4 clips using start and end times, and stream supported media directly online.
        </p>
      </div>

      {/* 2. Platform Deep-Dive Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>Supported Platforms & Powerful Features</span>
          </h3>
          <span className="text-[11px] text-zinc-500 hidden sm:inline font-mono">
            Fast • Watermark-Free • 100% Free
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLATFORM_FEATURES.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${item.border} bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm space-y-3 transition hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${item.bg} ${item.color} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-750"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. How to Download Step-by-Step Guide */}
      <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/30 space-y-4">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            How to Download Videos & Audio Online Free
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-500">
            Four simple steps to save videos, music, photos, or custom clips directly to your device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {HOW_IT_WORKS.map((step, sIdx) => (
            <div
              key={sIdx}
              className="p-3.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-900/60 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {step.step}
                </span>
                <Check className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {step.title}
              </h5>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Why Choose A2Z Downloader - Feature Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>All Tools in One</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-normal">
            No need to switch between different websites for YouTube, TikTok, Facebook, IG, and TeraBox.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>In-Browser Player</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-normal">
            Stream, preview, and verify videos or audio files online before downloading.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <Scissors className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Custom Trimming</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-normal">
            Select custom start and end timestamps to download exact video clips or ringtones.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/30 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Private & Ephemeral</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-normal">
            Zero permanent file retention. High-speed edge streaming with complete privacy.
          </p>
        </div>
      </div>

      {/* 5. Comprehensive Interactive FAQ Accordion */}
      <div id="faq" className="space-y-3 scroll-mt-20">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions (FAQ)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">12 Questions</span>
        </div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-4 py-3 text-left text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850/40 transition"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in-50 duration-150 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 6. SEO Topic Clusters Tag Cloud */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 space-y-2">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider text-center">
          Popular Search Clusters & Media Utilities
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto">
          {KEYWORD_TOPIC_PILLS.map((pill, pIdx) => (
            <span
              key={pIdx}
              className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-750/50"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

    </section>
  )
}
