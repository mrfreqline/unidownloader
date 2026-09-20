using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using Microsoft.Win32;

namespace A2ZDownloader
{
    public class UninstallerForm : Form
    {
        private Label statusLabel;
        private Button uninstallBtn;
        private Button cancelBtn;
        private ProgressBar progressBar;

        public UninstallerForm()
        {
            this.Text = "A2Z Downloader - Uninstall";
            this.Size = new Size(480, 260);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(18, 18, 20);
            this.ForeColor = Color.White;

            Label title = new Label();
            title.Text = "Uninstall A2Z Downloader";
            title.Font = new Font("Segoe UI", 15, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(239, 68, 68); // Red
            title.Location = new Point(24, 20);
            title.AutoSize = true;
            this.Controls.Add(title);

            statusLabel = new Label();
            statusLabel.Text = "Are you sure you want to remove A2Z Downloader and all its shortcuts from your computer?";
            statusLabel.Font = new Font("Segoe UI", 9.5f);
            statusLabel.ForeColor = Color.FromArgb(200, 200, 200);
            statusLabel.Location = new Point(26, 65);
            statusLabel.Size = new Size(420, 45);
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(26, 120);
            progressBar.Size = new Size(410, 18);
            progressBar.Visible = false;
            this.Controls.Add(progressBar);

            uninstallBtn = new Button();
            uninstallBtn.Text = "Uninstall";
            uninstallBtn.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            uninstallBtn.BackColor = Color.FromArgb(239, 68, 68);
            uninstallBtn.ForeColor = Color.White;
            uninstallBtn.FlatStyle = FlatStyle.Flat;
            uninstallBtn.FlatAppearance.BorderSize = 0;
            uninstallBtn.Location = new Point(230, 160);
            uninstallBtn.Size = new Size(110, 36);
            uninstallBtn.Click += (s, e) => PerformUninstall();
            this.Controls.Add(uninstallBtn);

            cancelBtn = new Button();
            cancelBtn.Text = "Cancel";
            cancelBtn.Font = new Font("Segoe UI", 9.5f);
            cancelBtn.BackColor = Color.FromArgb(40, 40, 45);
            cancelBtn.ForeColor = Color.White;
            cancelBtn.FlatStyle = FlatStyle.Flat;
            cancelBtn.FlatAppearance.BorderSize = 0;
            cancelBtn.Location = new Point(350, 160);
            cancelBtn.Size = new Size(86, 36);
            cancelBtn.Click += (s, e) => this.Close();
            this.Controls.Add(cancelBtn);
        }

        private void PerformUninstall()
        {
            uninstallBtn.Enabled = false;
            cancelBtn.Enabled = false;
            progressBar.Visible = true;
            progressBar.Value = 30;
            statusLabel.Text = "Removing shortcuts and configuration...";

            try
            {
                // 1. Remove Desktop Shortcuts
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string lnk = Path.Combine(desktop, "A2Z Downloader.lnk");
                string url = Path.Combine(desktop, "A2Z Downloader.url");
                if (File.Exists(lnk)) File.Delete(lnk);
                if (File.Exists(url)) File.Delete(url);

                progressBar.Value = 60;

                // 2. Remove Start Menu folder
                string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", "A2Z Downloader");
                if (Directory.Exists(startMenu))
                {
                    Directory.Delete(startMenu, true);
                }

                // 3. Remove Registry Key
                try
                {
                    using (RegistryKey parent = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                    {
                        if (parent != null)
                        {
                            parent.DeleteSubKeyTree("A2Z Downloader", false);
                        }
                    }
                }
                catch {}

                progressBar.Value = 100;
                statusLabel.Text = "A2Z Downloader has been completely removed.";

                // 4. Schedule self-deletion of install folder after exit
                string installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/C timeout /t 1 /nobreak > NUL & rmdir /S /Q \"" + installDir + "\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                Process.Start(psi);

                MessageBox.Show("A2Z Downloader was successfully uninstalled from your computer.", "Uninstalled", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Uninstall completed with notice: " + ex.Message, "Uninstall Notice", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            }
        }

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Silent uninstall check
            if (args != null && args.Length > 0 && (args[0].Equals("/S", StringComparison.OrdinalIgnoreCase) || args[0].Equals("/silent", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    if (File.Exists(Path.Combine(desktop, "A2Z Downloader.url"))) File.Delete(Path.Combine(desktop, "A2Z Downloader.url"));
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", "A2Z Downloader");
                    if (Directory.Exists(startMenu)) Directory.Delete(startMenu, true);
                    using (RegistryKey parent = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                    {
                        if (parent != null) parent.DeleteSubKeyTree("A2Z Downloader", false);
                    }
                    string installDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                    Process.Start(new ProcessStartInfo { FileName = "cmd.exe", Arguments = "/C timeout /t 1 /nobreak > NUL & rmdir /S /Q \"" + installDir + "\"", CreateNoWindow = true, UseShellExecute = false });
                }
                catch {}
                return;
            }

            Application.Run(new UninstallerForm());
        }
    }
}
