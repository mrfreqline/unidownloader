using System;
using System.IO;
using System.Reflection;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using Microsoft.Win32;

namespace A2ZDownloader
{
    public class InstallerForm : Form
    {
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkLaunch;
        private Button btnInstall;
        private Button btnCancel;
        private ProgressBar progressBar;
        private Label lblStatus;

        public InstallerForm()
        {
            this.Text = "A2Z Downloader - Setup Wizard";
            this.Size = new Size(500, 340);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(18, 18, 20);
            this.ForeColor = Color.White;

            // Brand Title
            Label title = new Label();
            title.Text = "A2Z Downloader Setup";
            title.Font = new Font("Segoe UI", 16, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(16, 185, 129); // Emerald
            title.Location = new Point(24, 20);
            title.AutoSize = true;
            this.Controls.Add(title);

            // Subtitle
            Label subtitle = new Label();
            subtitle.Text = "Universal Media Downloader for Windows PC";
            subtitle.Font = new Font("Segoe UI", 9.5f);
            subtitle.ForeColor = Color.FromArgb(160, 160, 160);
            subtitle.Location = new Point(26, 56);
            subtitle.AutoSize = true;
            this.Controls.Add(subtitle);

            // Options Group Box
            GroupBox grp = new GroupBox();
            grp.Text = " Installation Options ";
            grp.Font = new Font("Segoe UI", 9f);
            grp.ForeColor = Color.FromArgb(200, 200, 200);
            grp.Location = new Point(26, 90);
            grp.Size = new Size(432, 120);

            chkDesktop = new CheckBox();
            chkDesktop.Text = "Create a Desktop shortcut icon";
            chkDesktop.Font = new Font("Segoe UI", 9.5f);
            chkDesktop.ForeColor = Color.White;
            chkDesktop.Location = new Point(20, 26);
            chkDesktop.Size = new Size(380, 24);
            chkDesktop.Checked = true;
            grp.Controls.Add(chkDesktop);

            chkStartMenu = new CheckBox();
            chkStartMenu.Text = "Add A2Z Downloader to Start Menu";
            chkStartMenu.Font = new Font("Segoe UI", 9.5f);
            chkStartMenu.ForeColor = Color.White;
            chkStartMenu.Location = new Point(20, 54);
            chkStartMenu.Size = new Size(380, 24);
            chkStartMenu.Checked = true;
            grp.Controls.Add(chkStartMenu);

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Launch A2Z Downloader after installation";
            chkLaunch.Font = new Font("Segoe UI", 9.5f);
            chkLaunch.ForeColor = Color.White;
            chkLaunch.Location = new Point(20, 82);
            chkLaunch.Size = new Size(380, 24);
            chkLaunch.Checked = true;
            grp.Controls.Add(chkLaunch);

            this.Controls.Add(grp);

            // Status label
            lblStatus = new Label();
            lblStatus.Text = "Ready to install. Click Install to continue.";
            lblStatus.Font = new Font("Segoe UI", 9f);
            lblStatus.ForeColor = Color.FromArgb(160, 160, 160);
            lblStatus.Location = new Point(26, 222);
            lblStatus.Size = new Size(430, 20);
            this.Controls.Add(lblStatus);

            // Progress Bar
            progressBar = new ProgressBar();
            progressBar.Location = new Point(26, 245);
            progressBar.Size = new Size(432, 14);
            progressBar.Visible = false;
            this.Controls.Add(progressBar);

            // Buttons
            btnInstall = new Button();
            btnInstall.Text = "Install";
            btnInstall.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            btnInstall.BackColor = Color.FromArgb(16, 185, 129);
            btnInstall.ForeColor = Color.Black;
            btnInstall.FlatStyle = FlatStyle.Flat;
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Location = new Point(242, 255);
            btnInstall.Size = new Size(116, 36);
            btnInstall.Click += (s, e) => PerformInstall();
            this.Controls.Add(btnInstall);

            btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Font = new Font("Segoe UI", 9.5f);
            btnCancel.BackColor = Color.FromArgb(40, 40, 45);
            btnCancel.ForeColor = Color.White;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Location = new Point(366, 255);
            btnCancel.Size = new Size(92, 36);
            btnCancel.Click += (s, e) => this.Close();
            this.Controls.Add(btnCancel);
        }

        private void PerformInstall()
        {
            btnInstall.Enabled = false;
            btnCancel.Enabled = false;
            chkDesktop.Enabled = false;
            chkStartMenu.Enabled = false;
            chkLaunch.Enabled = false;
            progressBar.Visible = true;
            progressBar.Value = 20;
            lblStatus.Text = "Creating installation directory...";

            try
            {
                // Target folder: %LocalAppData%\Programs\A2Z Downloader
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string installDir = Path.Combine(localAppData, "Programs", "A2Z Downloader");

                if (!Directory.Exists(installDir))
                {
                    Directory.CreateDirectory(installDir);
                }

                progressBar.Value = 40;
                lblStatus.Text = "Installing application files...";

                // Extract embedded executables
                string appExePath = Path.Combine(installDir, "A2Z Downloader.exe");
                string uninstallerPath = Path.Combine(installDir, "Uninstall.exe");

                ExtractResource("A2ZDownloader.exe", appExePath);
                ExtractResource("Uninstall.exe", uninstallerPath);

                progressBar.Value = 70;
                lblStatus.Text = "Configuring shortcuts and system integration...";

                // 1. Desktop Shortcut
                if (chkDesktop.Checked)
                {
                    string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                    string shortcutPath = Path.Combine(desktop, "A2Z Downloader.url");
                    using (StreamWriter w = new StreamWriter(shortcutPath))
                    {
                        w.WriteLine("[InternetShortcut]");
                        w.WriteLine("URL=https://a2zdownloader.vercel.app");
                        w.WriteLine("IconIndex=0");
                        w.WriteLine("IconFile=https://a2zdownloader.vercel.app/favicon.ico");
                    }
                }

                // 2. Start Menu Shortcut
                if (chkStartMenu.Checked)
                {
                    string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", "A2Z Downloader");
                    if (!Directory.Exists(startMenu))
                    {
                        Directory.CreateDirectory(startMenu);
                    }
                    string appShortcut = Path.Combine(startMenu, "A2Z Downloader.url");
                    using (StreamWriter w = new StreamWriter(appShortcut))
                    {
                        w.WriteLine("[InternetShortcut]");
                        w.WriteLine("URL=https://a2zdownloader.vercel.app");
                        w.WriteLine("IconIndex=0");
                        w.WriteLine("IconFile=https://a2zdownloader.vercel.app/favicon.ico");
                    }
                    string uninstallerShortcut = Path.Combine(startMenu, "Uninstall A2Z Downloader.url");
                    using (StreamWriter w = new StreamWriter(uninstallerShortcut))
                    {
                        w.WriteLine("[InternetShortcut]");
                        w.WriteLine("URL=file:///" + uninstallerPath.Replace('\\', '/'));
                    }
                }

                progressBar.Value = 90;
                lblStatus.Text = "Registering with Windows Apps and Programs...";

                // 3. Register in Windows Settings / Control Panel (Add or Remove Programs)
                try
                {
                    string uninstKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\A2Z Downloader";
                    using (RegistryKey rk = Registry.CurrentUser.CreateSubKey(uninstKey))
                    {
                        if (rk != null)
                        {
                            rk.SetValue("DisplayName", "A2Z Downloader", RegistryValueKind.String);
                            rk.SetValue("DisplayVersion", "2.0.0", RegistryValueKind.String);
                            rk.SetValue("Publisher", "A2Z Downloader Team", RegistryValueKind.String);
                            rk.SetValue("InstallLocation", installDir, RegistryValueKind.String);
                            rk.SetValue("UninstallString", "\"" + uninstallerPath + "\"", RegistryValueKind.String);
                            rk.SetValue("QuietUninstallString", "\"" + uninstallerPath + "\" /S", RegistryValueKind.String);
                            rk.SetValue("DisplayIcon", appExePath, RegistryValueKind.String);
                            rk.SetValue("URLInfoAbout", "https://a2zdownloader.vercel.app", RegistryValueKind.String);
                            rk.SetValue("HelpLink", "https://a2zdownloader.vercel.app", RegistryValueKind.String);
                            rk.SetValue("EstimatedSize", 12400, RegistryValueKind.DWord);
                            rk.SetValue("NoModify", 1, RegistryValueKind.DWord);
                            rk.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                        }
                    }
                }
                catch {}

                progressBar.Value = 100;
                lblStatus.Text = "Installation complete!";

                // 4. Launch if requested
                if (chkLaunch.Checked)
                {
                    try
                    {
                        Process.Start(new ProcessStartInfo { FileName = appExePath, UseShellExecute = true });
                    }
                    catch {}
                }

                MessageBox.Show("A2Z Downloader installed successfully!\n\nYou can access it from your Desktop or Start Menu anytime.", "Installation Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Setup error: " + ex.Message, "Setup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                this.Close();
            }
        }

        private void ExtractResource(string resourceName, string targetPath)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream s = assembly.GetManifestResourceStream(resourceName))
            {
                if (s != null)
                {
                    using (FileStream fs = new FileStream(targetPath, FileMode.Create, FileAccess.Write))
                    {
                        byte[] buffer = new byte[8192];
                        int read;
                        while ((read = s.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            fs.Write(buffer, 0, read);
                        }
                    }
                }
                else
                {
                    // Fallback if resource name differs
                    foreach (string name in assembly.GetManifestResourceNames())
                    {
                        if (name.EndsWith(resourceName, StringComparison.OrdinalIgnoreCase))
                        {
                            using (Stream s2 = assembly.GetManifestResourceStream(name))
                            using (FileStream fs2 = new FileStream(targetPath, FileMode.Create, FileAccess.Write))
                            {
                                byte[] buffer = new byte[8192];
                                int read;
                                while ((read = s2.Read(buffer, 0, buffer.Length)) > 0)
                                {
                                    fs2.Write(buffer, 0, read);
                                }
                            }
                            return;
                        }
                    }
                }
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
