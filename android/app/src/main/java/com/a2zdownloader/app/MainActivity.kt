package com.a2zdownloader.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val appUrl = "https://a2zdownloader.vercel.app"
    private var cachedUserAgent: String = ""

    inner class AndroidBridge {
        @JavascriptInterface
        fun download(url: String, filename: String?, mimeType: String?) {
            try {
                val absoluteUrl = if (url.startsWith("http://") || url.startsWith("https://")) {
                    url
                } else {
                    "$appUrl${if (url.startsWith("/")) "" else "/"}$url"
                }
                val ua = if (cachedUserAgent.isNotEmpty()) cachedUserAgent else "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 A2ZDownloaderApp/2.0.0"
                downloadFileNative(absoluteUrl, ua, filename, mimeType ?: "video/mp4")
            } catch (e: Exception) {
                runOnUiThread {
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(browserIntent)
                    } catch (ex: Exception) {}
                }
            }
        }

        @JavascriptInterface
        fun isNativeApp(): Boolean {
            return true
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request modern Android permissions
        checkPermissions()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.userAgentString = settings.userAgentString + " A2ZDownloaderApp/2.0.0"

            cachedUserAgent = settings.userAgentString

            addJavascriptInterface(AndroidBridge(), "AndroidBridge")

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    val url = uri.toString()

                    // Handle external intents (WhatsApp, Market, Intent schemes)
                    if (url.startsWith("intent:") || url.startsWith("whatsapp:") || url.startsWith("market:")) {
                        try {
                            val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                            startActivity(intent)
                        } catch (e: Exception) {
                            // ignore
                        }
                        return true
                    }

                    // Check if this is a direct media file URL (mp4, mp3, cdn, etc.) or a download route
                    val path = uri.path?.lowercase() ?: ""
                    val host = uri.host?.lowercase() ?: ""
                    val isMediaDownload = path.endsWith(".mp4") || path.endsWith(".mp3") || path.endsWith(".m4a") ||
                                          path.endsWith(".webm") || path.contains("videoplayback") ||
                                          host.contains("cdninstagram.com") || host.contains("fbcdn.net") ||
                                          url.contains("/api/download")

                    if (isMediaDownload) {
                        downloadFileNative(url, cachedUserAgent, null, if (path.endsWith(".mp3")) "audio/mpeg" else "video/mp4")
                        return true
                    }

                    // Keep app on main domain. Open external ads or links in system browser so WebView state is NEVER lost!
                    val isAppDomain = host == "a2zdownloader.vercel.app" || 
                                     host.endsWith(".vercel.app") || 
                                     host == "localhost" || 
                                     host == "127.0.0.1"

                    if (!isAppDomain) {
                        try {
                            val externalIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }
                            startActivity(externalIntent)
                        } catch (e: Exception) {
                            // ignore
                        }
                        return true
                    }

                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                // Allows HTML5 video fullscreen and modern media controls
            }

            // Vidmate-Style Native Download Interceptor
            setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
                val ua = if (!userAgent.isNullOrBlank()) userAgent else cachedUserAgent
                downloadFileNative(url, ua, contentDisposition, mimeType)
            }
        }

        setContentView(webView)

        // Handle Back button navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Check for Shared URL from YouTube, TikTok, Reels (Vidmate "Share to Download" feature)
        handleIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIncomingIntent(it) }
    }

    private fun handleIncomingIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_SEND && intent.type == "text/plain") {
            val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
            if (!sharedText.isNullOrBlank()) {
                val target = "$appUrl?shared=${Uri.encode(sharedText.trim())}"
                webView.loadUrl(target)
                return
            }
        }
        webView.loadUrl(appUrl)
    }

    private fun downloadFileNative(initialUrl: String, userAgent: String, rawFileName: String?, mimeType: String) {
        Thread {
            var targetUrl = initialUrl
            try {

                // Step 1: Follow any 301, 302, 307 redirects to get the real direct CDN URL
                try {
                    val conn = URL(initialUrl).openConnection() as HttpURLConnection
                    conn.instanceFollowRedirects = false
                    conn.requestMethod = "HEAD"
                    conn.setRequestProperty("User-Agent", userAgent)
                    if (initialUrl.contains("savetube") || initialUrl.contains("yt.savetube")) {
                        conn.setRequestProperty("Referer", "https://yt.savetube.me/")
                    } else if (initialUrl.contains("tikwm")) {
                        conn.setRequestProperty("Referer", "https://www.tikwm.com/")
                    } else if (initialUrl.contains("instagram") || initialUrl.contains("fbcdn") || initialUrl.contains("cdninstagram")) {
                        conn.setRequestProperty("Referer", "https://www.instagram.com/")
                    }
                    conn.connectTimeout = 8000
                    conn.readTimeout = 8000
                    val code = conn.responseCode
                    if (code in 300..399) {
                        val loc = conn.getHeaderField("Location")
                        if (!loc.isNullOrBlank()) {
                            targetUrl = loc
                        }
                    }
                    conn.disconnect()
                } catch (e: Exception) {
                    // ignore redirect check error, use initialUrl
                }

                // Step 2: Clean and validate file name
                val cleanFileName = if (!rawFileName.isNullOrBlank() && !rawFileName.startsWith("attachment")) {
                    rawFileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
                } else {
                    URLUtil.guessFileName(targetUrl, null, mimeType)
                }

                val safeFileName = if (cleanFileName.length > 50) {
                    val dotIdx = cleanFileName.lastIndexOf('.')
                    if (dotIdx > 0) cleanFileName.substring(0, 44) + cleanFileName.substring(dotIdx) else cleanFileName.substring(0, 50)
                } else cleanFileName

                // Step 3: Configure native DownloadManager request with proper CDN Referer
                val request = DownloadManager.Request(Uri.parse(targetUrl)).apply {
                    setMimeType(mimeType)
                    addRequestHeader("User-Agent", userAgent)
                    if (targetUrl.contains("savetube") || targetUrl.contains("yt.savetube")) {
                        addRequestHeader("Referer", "https://yt.savetube.me/")
                    } else if (targetUrl.contains("tikwm")) {
                        addRequestHeader("Referer", "https://www.tikwm.com/")
                    } else if (targetUrl.contains("instagram") || targetUrl.contains("fbcdn") || targetUrl.contains("cdninstagram")) {
                        addRequestHeader("Referer", "https://www.instagram.com/")
                    }
                    setDescription("Downloading with A2Z Downloader...")
                    setTitle(safeFileName)
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeFileName)
                }

                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                val downloadId = dm.enqueue(request)

                runOnUiThread {
                    Toast.makeText(this@MainActivity, "⬇️ Downloading $safeFileName...", Toast.LENGTH_SHORT).show()
                }

                // Step 4: Real-time progress monitoring loop
                var isTracking = true
                var failCount = 0
                while (isTracking) {
                    Thread.sleep(750)
                    val q = DownloadManager.Query().setFilterById(downloadId)
                    val cursor = dm.query(q)
                    if (cursor != null && cursor.moveToFirst()) {
                        val bytesDownloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                        val totalBytes = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                        val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

                        val percent = if (totalBytes > 0) ((bytesDownloaded * 100L) / totalBytes).toInt() else 0

                        runOnUiThread {
                            val js = "window.onNativeDownloadProgress?.($downloadId, $percent, $bytesDownloaded, $totalBytes, '$safeFileName')"
                            webView.evaluateJavascript(js, null)
                        }

                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            isTracking = false
                            runOnUiThread {
                                Toast.makeText(this@MainActivity, "✅ $safeFileName Downloaded!", Toast.LENGTH_LONG).show()
                                webView.evaluateJavascript("window.onNativeDownloadComplete?.($downloadId, '$safeFileName')", null)
                            }
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            isTracking = false
                            val reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                            runOnUiThread {
                                Toast.makeText(this@MainActivity, "Starting in browser download manager...", Toast.LENGTH_SHORT).show()
                                webView.evaluateJavascript("window.onNativeDownloadFailed?.($downloadId, '$safeFileName', $reason)", null)
                                try {
                                    val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)).apply {
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    startActivity(browserIntent)
                                } catch (e: Exception) {}
                            }
                        }
                    } else {
                        failCount++
                        if (failCount > 10) isTracking = false
                    }
                    cursor?.close()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Opening browser download...", Toast.LENGTH_SHORT).show()
                    try {
                        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(targetUrl)).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(browserIntent)
                    } catch (ex: Exception) {}
                }
            }
        }.start()
    }

    private fun checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), 102)
            }
        }
    }
}
