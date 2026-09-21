import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anonymous Instagram Viewer & Story Downloader | Watch Stories & Reels Anonymously - A2Z Downloader',
  description:
    'Free Anonymous Instagram Viewer. View and download Instagram profiles, stories, reels, carousels, and HD profile pictures 100% anonymously with zero login required. Fast, private, and secure.',
  keywords: [
    'anonymous instagram viewer',
    'view instagram stories anonymously',
    'instagram story viewer',
    'watch insta stories secretly',
    'instagram profile viewer',
    'download instagram reels anonymously',
    'instagram carousel downloader',
    'anonymous viewer',
    'view instagram without account',
    'story saver online',
    'inflact alternative',
    'fastdl alternative',
    'download instagram dp hd',
    'tiktok profile viewer',
    'snapchat profile viewer',
    'facebook profile viewer',
    'A2Z anonymous viewer',
  ],
  alternates: {
    canonical: 'https://a2zdownloader.vercel.app/anonymous-viewer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Anonymous Instagram Viewer & Story Downloader | A2Z Downloader',
    description:
      'View and download Instagram profiles, stories, 1080p reels, carousels, and HD avatars completely anonymously without logging in or leaving any trace.',
    url: 'https://a2zdownloader.vercel.app/anonymous-viewer',
    siteName: 'A2Z Downloader',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://a2zdownloader.vercel.app/logo.png',
        width: 1200,
        height: 630,
        alt: 'A2Z Anonymous Viewer - Instagram Story & Reel Downloader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anonymous Instagram Viewer & Story Downloader | A2Z Downloader',
    description:
      'View & download Instagram stories, reels, carousels, and profiles anonymously without an account in original full HD resolution.',
    images: ['https://a2zdownloader.vercel.app/logo.png'],
  },
}

export default function AnonymousViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://a2zdownloader.vercel.app/anonymous-viewer#webapp',
        name: 'A2Z Anonymous Instagram Viewer',
        url: 'https://a2zdownloader.vercel.app/anonymous-viewer',
        description:
          'Free online anonymous viewer and downloader for Instagram stories, reels, posts, carousels, and profile pictures.',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires modern web browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '1580',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: [
          'Anonymous Instagram Story Viewer with zero view trace',
          'Full 1080p HD Instagram Reel and Video Player & Downloader',
          'Multi-Photo Carousel Batch Downloader',
          'Full Resolution Profile Avatar Downloader',
          '100% Free with No Account or Registration Required',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://a2zdownloader.vercel.app/anonymous-viewer#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://a2zdownloader.vercel.app',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Anonymous Viewer',
            item: 'https://a2zdownloader.vercel.app/anonymous-viewer',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://a2zdownloader.vercel.app/anonymous-viewer#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can someone see if I view their Instagram story using A2Z Anonymous Viewer?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. When you use A2Z Anonymous Viewer, the request is fetched securely through our server proxy without your Instagram identity. The account owner will never see your username in their story views list.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need to log into an Instagram account to view profiles or stories?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No account login, password, or registration is required. You can view public Instagram profiles, stories, reels, and carousels completely free and anonymously.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I download Instagram reels and multi-photo carousel posts?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! You can preview reels with our built-in video player, download 1080p MP4 videos, and download individual or all photos from multi-image carousel posts in full original resolution.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does A2Z Anonymous Viewer work on mobile phones and iPhone?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, A2Z Downloader is fully mobile-responsive and works seamlessly in any browser on iPhone (iOS Safari, Chrome), Android devices, iPad, Mac, and Windows PC.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      {children}
    </>
  )
}
