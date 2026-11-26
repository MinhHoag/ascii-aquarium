using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new AquariumWindow());
    }
}

internal sealed class AquariumWindow : Form
{
    private const string Origin = "https://aquarium.local";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly Dictionary<string, (string Name, string Type)> Assets = new()
    {
        ["/"] = ("index.html", "text/html"),
        ["/index.html"] = ("index.html", "text/html"),
        ["/reef.css"] = ("reef.css", "text/css"),
        ["/reef.js"] = ("reef.js", "text/javascript"),
        ["/wallpaper.js"] = ("wallpaper.js", "text/javascript")
    };

    private readonly WebView2 view = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(8, 8, 8) };
    private readonly NowPlaying nowPlaying = new();
    private int meals;
    private DateTimeOffset last = DateTimeOffset.UnixEpoch;
    private bool fullscreen;
    private Rectangle normalBounds;
    private FormWindowState normalState;

    public AquariumWindow()
    {
        Text = "ASCII Aquarium";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        BackColor = Color.FromArgb(8, 8, 8);
        ClientSize = new Size(1150, 740);
        MinimumSize = new Size(340, 360);
        StartPosition = FormStartPosition.CenterScreen;
        Controls.Add(view);
    }

    protected override async void OnShown(EventArgs args)
    {
        base.OnShown(args);
        SetFullscreen(true);
        try
        {
            var profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AsciiAquarium", "WebView2");
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: profile);
            if (IsDisposed) return;
            await view.EnsureCoreWebView2Async(environment);
            if (IsDisposed) return;

            var browser = view.CoreWebView2;
            browser.Settings.AreDefaultContextMenusEnabled = false;
            browser.Settings.AreDevToolsEnabled = false;
            browser.Settings.IsStatusBarEnabled = false;
            browser.NavigationStarting += (_, navigation) => navigation.Cancel = !IsAquarium(navigation.Uri);
            browser.NewWindowRequested += (_, popup) => popup.Handled = true;
            browser.WebMessageReceived += OnWebMessage;
            browser.AddWebResourceRequestedFilter(Origin + "/*", CoreWebView2WebResourceContext.All);
            browser.WebResourceRequested += OnRequest;
            await browser.AddScriptToExecuteOnDocumentCreatedAsync("window.aquariumStartsFullscreen = true;");
            browser.Navigate(Origin + "/");
        }
        catch (Exception error)
        {
            if (IsDisposed) return;
            MessageBox.Show(this, "ASCII Aquarium could not open. Make sure the Microsoft Edge WebView2 Runtime is installed.\n\n" +
                error.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private async void OnRequest(object? sender, CoreWebView2WebResourceRequestedEventArgs args)
    {
        using var deferral = args.GetDeferral();
        try
        {
            var uri = new Uri(args.Request.Uri);
            var method = args.Request.Method;
            if (method == "GET" && Assets.TryGetValue(uri.AbsolutePath, out var asset) &&
                typeof(AquariumWindow).Assembly.GetManifestResourceStream("Aquarium.Web." + asset.Name) is { } stream)
            {
                Reply(args, stream, asset.Type);
                return;
            }

            switch (method, uri.AbsolutePath)
            {
                case ("GET", "/api/tank"):
                    ReplyJson(args, TankState());
                    break;
                case ("GET", "/api/now-playing"):
                    var known = uri.Query.StartsWith("?knownArtwork=", StringComparison.Ordinal)
                        ? Uri.UnescapeDataString(uri.Query[14..]) : null;
                    ReplyJson(args, await nowPlaying.ReadAsync(known));
                    break;
                case ("POST", "/api/feed"):
                    if (!args.Request.Headers.Contains("X-Aquarium") || args.Request.Headers.GetHeader("X-Aquarium") != "feed")
                    {
                        Reply(args, Stream.Null, "text/plain", 400, "Bad Request");
                        break;
                    }
                    meals++;
                    last = DateTimeOffset.UtcNow;
                    ReplyJson(args, TankState());
                    break;
                default:
                    Reply(args, Stream.Null, "text/plain", 404, "Not Found");
                    break;
            }
        }
        catch (Exception error)
        {
            System.Diagnostics.Debug.WriteLine(error);
            if (!IsDisposed)
                Reply(args, Stream.Null, "text/plain", 500, "Internal Server Error");
        }
    }

    private object TankState() => new { meals, last, source = meals > 0 ? "Desktop" : "" };

    private void ReplyJson(CoreWebView2WebResourceRequestedEventArgs args, object value) =>
        Reply(args, new MemoryStream(JsonSerializer.SerializeToUtf8Bytes(value, Json), writable: false), "application/json");

    private void Reply(CoreWebView2WebResourceRequestedEventArgs args, Stream stream, string type,
        int code = 200, string reason = "OK")
    {
        args.Response = view.CoreWebView2.Environment.CreateWebResourceResponse(stream, code, reason,
            $"Content-Type: {type}; charset=utf-8\r\nCache-Control: no-store");
    }

    private static bool IsAquarium(string address) =>
        Uri.TryCreate(address, UriKind.Absolute, out var uri) && uri.GetLeftPart(UriPartial.Authority) == Origin;

    private void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (!IsAquarium(args.Source)) return;
        using var message = JsonDocument.Parse(args.WebMessageAsJson);
        var root = message.RootElement;
        if (root.ValueKind != JsonValueKind.Object ||
            !root.TryGetProperty("type", out var type) || type.ValueKind != JsonValueKind.String ||
            type.GetString() != "aquarium-fullscreen" || !root.TryGetProperty("active", out var active) ||
            active.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
            return;

        SetFullscreen(active.GetBoolean());
    }

    private void SetFullscreen(bool active)
    {
        if (fullscreen == active) return;
        fullscreen = active;
        if (active)
        {
            normalState = WindowState;
            normalBounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            var screen = Screen.FromControl(this).Bounds;
            WindowState = FormWindowState.Normal;
            FormBorderStyle = FormBorderStyle.None;
            Bounds = screen;
        }
        else
        {
            FormBorderStyle = FormBorderStyle.Sizable;
            Bounds = normalBounds;
            WindowState = normalState;
        }
    }
}
