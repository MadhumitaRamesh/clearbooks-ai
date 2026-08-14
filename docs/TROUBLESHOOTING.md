# Troubleshooting

## Expo Go Connectivity Issues

If Expo Go gets stuck on "Opening project..." or times out when connecting to the dev server, **don't waste time debugging Wi-Fi networks or firewalls**. 

Instead, just run the tunnel script from the `app/` folder:
```bash
npm run start:tunnel
```
*(This is a shortcut for `npx expo start --tunnel -c`)*

### Why this happens
This error is almost always caused by:
1. **AP Isolation:** Your local Wi-Fi router is blocking device-to-device communication.
2. **macOS Firewall:** The built-in firewall is blocking incoming connections on port 8081. *(Note: macOS Firewall state cannot be auto-verified via scripts without a password. You can manually check it in System Settings → Network → Firewall, but tunnel mode makes this a non-issue either way).*
3. **Stale IPs:** Your computer's local IP address changed (e.g. after a restart), and Expo Go is trying to hit an old IP.

### How Tunnel Mode fixes it
Running in tunnel mode routes the connection securely through Expo's servers (via ngrok) rather than your local Wi-Fi network. This completely bypasses router and firewall restrictions, which is what caused this on August 14, 2026.

**⚠️ Important Note:** The QR code and URL (e.g. `exp://...exp.direct`) will be **different every single time** you restart the tunnel server. Always scan whatever fresh code the terminal shows in that exact session, rather than trying to use a saved or old one.
