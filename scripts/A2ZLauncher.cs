using System;
using System.IO;
using System.Diagnostics;

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
                        Arguments = "--app=" + url + " --window-size=1200,860",
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
                        Arguments = "--app=" + url + " --window-size=1200,860",
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
