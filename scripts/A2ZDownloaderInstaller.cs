using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;

namespace A2ZDownloader
{
    public class InstallerForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Button launchBtn;
        private Timer timer;
        private int step = 0;

        public InstallerForm()
        {
            this.Text = "A2Z Downloader - Windows Setup";
            this.Size = new Size(460, 260);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(18, 18, 20);
            this.ForeColor = Color.White;

            Label title = new Label();
            title.Text = "A2Z Downloader Setup";
            title.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(16, 185, 129);
            title.Location = new Point(24, 20);
            title.AutoSize = true;
            this.Controls.Add(title);

            statusLabel = new Label();
            statusLabel.Text = "Preparing installation...";
            statusLabel.Font = new Font("Segoe UI", 10);
            statusLabel.ForeColor = Color.FromArgb(200, 200, 200);
            statusLabel.Location = new Point(26, 60);
            statusLabel.Size = new Size(400, 30);
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(26, 100);
            progressBar.Size = new Size(390, 22);
            progressBar.Style = ProgressBarStyle.Continuous;
            this.Controls.Add(progressBar);

            launchBtn = new Button();
            launchBtn.Text = "Launch A2Z Downloader";
            launchBtn.Font = new Font("Segoe UI", 10, FontStyle.Bold);
            launchBtn.BackColor = Color.FromArgb(16, 185, 129);
            launchBtn.ForeColor = Color.Black;
            launchBtn.FlatStyle = FlatStyle.Flat;
            launchBtn.FlatAppearance.BorderSize = 0;
            launchBtn.Location = new Point(110, 150);
            launchBtn.Size = new Size(220, 42);
            launchBtn.Visible = false;
            launchBtn.Click += (s, e) => { LaunchApp(); this.Close(); };
            this.Controls.Add(launchBtn);

            timer = new Timer();
            timer.Interval = 200;
            timer.Tick += OnTick;
            timer.Start();
        }

        private void OnTick(object sender, EventArgs e)
        {
            step++;
            if (step == 2)
            {
                progressBar.Value = 30;
                statusLabel.Text = "Configuring application runtime...";
            }
            else if (step == 4)
            {
                progressBar.Value = 70;
                statusLabel.Text = "Creating Desktop shortcut...";
                CreateDesktopShortcut();
            }
            else if (step == 6)
            {
                progressBar.Value = 100;
                statusLabel.Text = "Installation complete! Ready to use.";
                timer.Stop();
                launchBtn.Visible = true;
                Timer autoTimer = new Timer();
                autoTimer.Interval = 1000;
                autoTimer.Tick += (s, ev) => { autoTimer.Stop(); LaunchApp(); this.Close(); };
                autoTimer.Start();
            }
        }

        private void CreateDesktopShortcut()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string shortcutPath = Path.Combine(desktop, "A2Z Downloader.url");
                using (StreamWriter writer = new StreamWriter(shortcutPath))
                {
                    writer.WriteLine("[InternetShortcut]");
                    writer.WriteLine("URL=https://a2zdownloader.vercel.app");
                    writer.WriteLine("IconIndex=0");
                    writer.WriteLine("IconFile=https://a2zdownloader.vercel.app/favicon.ico");
                }
            }
            catch {}
        }

        private void LaunchApp()
        {
            string url = "https://a2zdownloader.vercel.app";
            try
            {
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }
                if (File.Exists(edgePath))
                {
                    Process.Start(edgePath, "--app=" + url);
                    return;
                }

                string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
                if (File.Exists(chromePath))
                {
                    Process.Start(chromePath, "--app=" + url);
                    return;
                }

                Process.Start(url);
            }
            catch
            {
                Process.Start(url);
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
