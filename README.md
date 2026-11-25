# ASCII Aquarium

An animated ASCII aquarium for Windows. The laptop runs the tank and exposes a Bluetooth LE feeding service. The iPhone opens a separate controller in Bluefy. Feedings and the six-digit code reset when the laptop app restarts.

## Run the Windows app

Open **AsciiAquarium.exe** on Windows x64. It starts in a borderless fullscreen window with the wallpaper clock enabled. Press Escape or click the fullscreen icon to return to a window. The app stores its own layout and wallpaper settings in the local WebView2 profile.

The executable bundles .NET and the aquarium. It uses the [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/), which is included on Windows 11. Live Now Playing reads the active Windows media session. The separate Bluefy controller belongs to the local development server.

To build the executable with the .NET 10 SDK, run `dotnet publish desktop/AsciiAquarium.Desktop.csproj -c Release -o dist`.

## Run the local development server

Double-click **Start Aquarium.cmd**. It requires the .NET 8 SDK and tries to build the BLE version first. The first BLE build downloads Microsoft's Windows SDK reference package from NuGet. The launcher falls back to a desktop demo if it cannot build the BLE version.

The aquarium is at http://127.0.0.1:5184. Click **Feed the fish** or click along the water surface to drop food at that spot.
Use the top-center fullscreen icon to fill the screen with the tank. **Customize tank** opens upward from the bottom center. In fullscreen, selecting an item keeps the panel closed until you open it. The panel collapses after 10 seconds of inactivity.

Under **Customize tank → Add items → Personalize**, add **Now playing** for a read-only ASCII turntable. It shows the active Windows media session and crops its thumbnail to the vinyl face in colored ASCII when artwork is available. The record rotates while media plays.

Add **Snow globe timer** from the same tab for a visual countdown and a short beep at zero. To restart a finished globe for the same duration, hold and shake it side to side or release it near the surface so it falls to the gravel. A running globe keeps counting through both gestures.

Under **Customize tank → Wallpaper**, choose a clock with seconds or custom text. The bottom line can show the date, a caption, or nothing. Size and brightness are saved in the browser. The wallpaper sits behind the fish and only appears in fullscreen.

Open **Customize tank** to preview decorations in **Add items** or choose **Personalize** for text, a photo, a clock, or a countdown. Photos are processed locally at up to 480 pixels tall, then converted to a colored ASCII grid. Select a photo frame, clock, or text item and drag a corner to resize it. Use **In the tank** to select, resize, recolor, or remove personal items, and **Fish** to adjust feeding behavior. The tank header has controls to add fish or reset the school to six. Personalize items collide with and can stack on each other. Words stay where placed, while clocks and other items sink until they meet another personal item or the gravel. The browser saves the layout and ASCII photos locally.

## Open the controller in Bluefy

The aquarium page hides the phone controls. To use the separate controller on a configured laptop, open its private Tailscale Serve HTTPS link in Bluefy. Bluetooth carries feed commands.

### Other hosting options

Bluefy needs an HTTPS controller page. You can put only `wwwroot/phone.html`, `wwwroot/phone.js`, and `wwwroot/reef.css` on an HTTPS static host and open `/phone.html` in Bluefy. This page talks directly to the laptop over BLE, so the phone and laptop don't need to share Wi-Fi after the page loads.

For local HTTPS, put the laptop and phone on the same Wi-Fi. Take the laptop's Wi-Fi IPv4 address from `ipconfig`. Use a certificate valid for that IP and trusted on the phone. With [mkcert](https://github.com/FiloSottile/mkcert), substitute your own LAN address:

```powershell
mkcert -install
mkcert -cert-file phone-cert.pem -key-file phone-key.pem 192.168.1.23
node phone-https.mjs 192.168.1.23 phone-cert.pem phone-key.pem
```

For this local option, install **only** mkcert's public `rootCA.pem` certificate on the iPhone and enable full trust under Settings → General → About → Certificate Trust Settings. Keep `rootCA-key.pem` and the server key on the laptop. If Windows prompts for firewall access, use your private network. Open the printed HTTPS URL in Bluefy.

## Test feeding

1. Windows needs a Bluetooth adapter and driver that support the BLE peripheral role. The aquarium page currently hides the pairing code. The local `/api/tank` endpoint reports the code as `pin` and the Bluetooth status as `radio`. Enter the code in Bluefy, tap **Connect aquarium**, select the laptop, and tap **Feed the fish**.
2. Look for falling pellets on the laptop and **iPhone** in the last-fed field. You can feed again while the first batch is still in the tank.
3. For hands-free testing, turn on **Feed on reconnect**. Keep the controller open, leave BLE range for at least 12 seconds, and return. Then repeat with the screen locked. This uses connection range, so walls and the laptop's radio affect how far away it triggers. Locked-screen feeding depends on Bluefy and iOS keeping the controller active and needs a real-device test.
