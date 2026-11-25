var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5184", "http://127.0.0.1:5185");
var app = builder.Build();
var nowPlaying = new NowPlaying();

var gate = new object();
var meals = builder.Configuration.GetValue("TankResume:Meals", 0);
var last = builder.Configuration.GetValue("TankResume:Last", DateTimeOffset.UnixEpoch);
var source = builder.Configuration["TankResume:Source"] ?? "";
var radio = "Local demo";
var pin = builder.Configuration["TankResume:Pin"] ??
    System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

object State()
{
    lock (gate) return new { meals, last, source, radio, pin };
}

object Feed(string from)
{
    lock (gate)
    {
        last = DateTimeOffset.UtcNow;
        source = from;
        meals++;
        return new { meals, last, source, radio, pin };
    }
}

#if WINDOWS
try
{
    var radioService = await TankBluetooth.Start(pin, () => Feed("iPhone"), status =>
    {
        lock (gate) radio = status;
    });
    app.Lifetime.ApplicationStopping.Register(radioService.StopAdvertising);
}
catch (Exception error)
{
    radio = $"Bluetooth unavailable: {error.Message}";
}
#endif

app.MapWhen(context => context.Connection.LocalPort == 5185, controller =>
{
    controller.Run(context =>
    {
        var asset = context.Request.Path.Value switch
        {
            "/" or "/phone.html" => ("phone.html", "text/html"),
            "/phone.js" => ("phone.js", "text/javascript"),
            "/reef.css" => ("reef.css", "text/css"),
            _ => ("", "")
        };
        if (!HttpMethods.IsGet(context.Request.Method) || asset.Item1 == "")
        {
            context.Response.StatusCode = 404;
            return Task.CompletedTask;
        }

        context.Response.ContentType = asset.Item2 + "; charset=utf-8";
        return context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath, asset.Item1));
    });
});
app.Use(async (context, next) =>
{
    if (context.Request.Host.Host is "127.0.0.1" or "localhost")
        await next();
    else
        context.Response.StatusCode = 400;
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapGet("/api/tank", (HttpContext http) =>
{
    http.Response.Headers.CacheControl = "no-store";
    return State();
});
app.MapGet("/api/now-playing", async (HttpContext http, string? knownArtwork) =>
{
    http.Response.Headers.CacheControl = "no-store";
    return await nowPlaying.ReadAsync(knownArtwork);
});
app.MapPost("/api/feed", (HttpRequest request) =>
{
    if (request.Headers["X-Aquarium"] != "feed") return Results.BadRequest();
    return Results.Ok(Feed("Laptop"));
});
if (Environment.GetEnvironmentVariable("PIXEL_REEF_OPEN_BROWSER") == "1")
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("http://127.0.0.1:5184")
            {
                UseShellExecute = true
            });
        }
        catch (Exception error)
        {
            Console.Error.WriteLine($"Open http://127.0.0.1:5184 in your browser. {error.Message}");
        }
    });
}
app.Run();
