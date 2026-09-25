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

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val appUrl = "https://a2zdownloader.vercel.app"

    inner class AndroidBridge {
        @JavascriptInterface
        fun download(url: String, filename: String?, mimeType: String?) {
            runOnUiThread {
                downloadFileNative(url, webView.settings.userAgentString, "attachment; filename=\"${filename ?: "download.mp4"}\"", mimeType ?: "video/mp4")
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

                    // Keep app on main domain. Open external ads or links in system browser so WebView state is NEVER lost!
                    val host = uri.host?.lowercase() ?: ""
                    val isAppDomain = host == "a2zdownloader.vercel.app" || 
                                     host.endsWith(".vercel.app") || 
                                     host == "localhost" || 
                                     host == "127.0.0.1"

                    if (!isAppDomain) {
                        try {
                            val externalIntent = Intent(Intent.ACTION_VIEW, uri)
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
                downloadFileNative(url, userAgent, contentDisposition, mimeType)
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

    private fun downloadFileNative(url: String, userAgent: String, contentDisposition: String, mimeType: String) {
        try {
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
            val request = DownloadManager.Request(Uri.parse(url)).apply {
                setMimeType(mimeType)
                addRequestHeader("User-Agent", userAgent)
                if (url.contains("savetube") || url.contains("yt.savetube")) {
                    addRequestHeader("Referer", "https://yt.savetube.me/")
                } else if (url.contains("tikwm")) {
                    addRequestHeader("Referer", "https://www.tikwm.com/")
                } else if (url.contains("instagram") || url.contains("fbcdn")) {
                    addRequestHeader("Referer", "https://www.instagram.com/")
                }
                setDescription("Downloading with A2Z Downloader...")
                setTitle(fileName)
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            }

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, "Downloading $fileName to Downloads folder", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            // Fallback: Open browser intent
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            } catch (ex: Exception) {
                Toast.makeText(this, "Download failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
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
