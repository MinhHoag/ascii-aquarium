using System.Runtime.InteropServices;
#if WINDOWS
using Windows.Media.Control;
using Windows.Storage.Streams;
#endif

sealed record TrackDisplay(string Title, string Artist, string Status, string ArtworkKey, string? Artwork);

sealed class NowPlaying
{
    private static readonly TrackDisplay Idle = new("", "", "idle", "", null);
#if WINDOWS
    private readonly SemaphoreSlim gate = new(1, 1);
    private GlobalSystemMediaTransportControlsSessionManager? manager;
    private (string Source, string Title, string Artist, string Album)? track;
    private string artworkKey = "";
    private string? artwork;
    private DateTimeOffset retryArtworkAfter;
#endif

    public Task<TrackDisplay> ReadAsync(string? knownArtwork)
    {
#if WINDOWS
        return ReadWindowsAsync(knownArtwork);
#else
        return Task.FromResult(Idle with { Status = "unavailable" });
#endif
    }

#if WINDOWS
    private async Task<TrackDisplay> ReadWindowsAsync(string? knownArtwork)
    {
        await gate.WaitAsync();
        try
        {
            manager ??= await GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
            var session = manager.GetCurrentSession();
            const GlobalSystemMediaTransportControlsSessionPlaybackStatus playing =
                GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
            if (session?.GetPlaybackInfo()?.PlaybackStatus != playing)
                session = manager.GetSessions().FirstOrDefault(s => s.GetPlaybackInfo()?.PlaybackStatus == playing) ?? session;

            if (session is null)
                return Idle;

            var status = session.GetPlaybackInfo()?.PlaybackStatus;
            var media = await session.TryGetMediaPropertiesAsync();
            if (media is null)
                return Idle;

            var current = (session.SourceAppUserModelId, media.Title, media.Artist, media.AlbumTitle);
            if (track != current)
            {
                artwork = null;
                artworkKey = "";
                retryArtworkAfter = DateTimeOffset.MinValue;
                track = current;
            }
            if (artwork is null && media.Thumbnail is { } thumbnail && DateTimeOffset.UtcNow >= retryArtworkAfter)
            {
                artwork = await ReadArtworkAsync(thumbnail);
                if (artwork is not null)
                    artworkKey = Guid.NewGuid().ToString("N");
                retryArtworkAfter = DateTimeOffset.UtcNow.AddSeconds(10);
            }

            return new(media.Title ?? "", media.Artist ?? "", status == playing ? "playing" : "paused",
                artworkKey, knownArtwork == artworkKey ? null : artwork);
        }
        catch (Exception error) when (error is COMException or UnauthorizedAccessException or InvalidOperationException)
        {
            manager = null;
            return Idle with { Status = "unavailable" };
        }
        finally
        {
            gate.Release();
        }
    }

    private static async Task<string?> ReadArtworkAsync(IRandomAccessStreamReference? thumbnail)
    {
        if (thumbnail is null)
            return null;

        try
        {
            using var stream = await thumbnail.OpenReadAsync();
            if (stream.Size is 0 or > 2_000_000)
                return null;

            using var reader = new DataReader(stream);
            var length = await reader.LoadAsync((uint)stream.Size);
            if (length != stream.Size)
                return null;
            var bytes = new byte[(int)length];
            reader.ReadBytes(bytes);
            var type = ImageType(bytes);
            return type is null ? null : $"data:{type};base64,{Convert.ToBase64String(bytes)}";
        }
        catch (Exception error) when (error is COMException or IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    private static string? ImageType(ReadOnlySpan<byte> bytes)
    {
        if (bytes.StartsWith(new byte[] { 0xff, 0xd8, 0xff })) return "image/jpeg";
        if (bytes.StartsWith(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a })) return "image/png";
        if (bytes.StartsWith("GIF87a"u8) || bytes.StartsWith("GIF89a"u8)) return "image/gif";
        if (bytes.StartsWith("BM"u8)) return "image/bmp";
        if (bytes.Length >= 12 && bytes.StartsWith("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WEBP"u8))
            return "image/webp";
        return null;
    }
#endif
}
