using System;
using System.IO;
using System.Diagnostics;
using System.Net;

namespace A2ZDownloader
{
    public class Launcher
    {
        [STAThread]
        public static void Main()
        {
            string url = "https://a2zdownloader.vercel.app";
            try
            {
                // Check if local Next.js development server is running on localhost:3000
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:3000");
                req.Timeout = 600;
                req.Method = "HEAD";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    if (resp.StatusCode == HttpStatusCode.OK)
                    {
                        url = "http://localhost:3000";
                    }
                }
            }
            catch {}

            try
            {
                string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "A2ZDownloader", "AppProfile");
                if (!Directory.Exists(appDataDir))
                {
                    Directory.CreateDirectory(appDataDir);
                }

                string appArgs = "--app=\"" + url + "\" --user-data-dir=\"" + appDataDir + "\" --window-size=1200,860";

                // Prefer Edge standalone app mode (native on all Windows 10 & 11)
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }
                if (File.Exists(edgePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = appArgs,
                        UseShellExecute = false
                    });
                    return;
                }

                // Try Chrome app mode
                string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
                if (!File.Exists(chromePath))
                {
                    chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
                }
                if (File.Exists(chromePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = chromePath,
                        Arguments = appArgs,
                        UseShellExecute = false
                    });
                    return;
                }

                // Fallback to default system browser
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch
            {
                try
                {
                    Process.Start(url);
                }
                catch {}
            }
        }
    }
}
