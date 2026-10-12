# Syntrix Audit — iOS app (Capacitor)

Field audit tool: Google / Social / Website checklists, weighted scores, top gaps → recommended GHL systems,
photos, offline drafts, share-sheet export.

## Build (needs a Mac with Xcode 15+ and an Apple Developer account)
```
npm install
npx cap add ios        # once
npx cap sync ios       # after any change in www/
npx cap open ios       # opens Xcode
```
In Xcode: select the App target → Signing & Capabilities → pick your Team → run on your iPhone (USB) or
Product → Archive → Distribute → TestFlight/App Store.
Add to `ios/App/App/Info.plist`:
- `NSCameraUsageDescription` — "Attach photos to audits"
- `NSPhotoLibraryUsageDescription` — "Attach photos to audits"

## Try in a browser first
`npm run serve` → http://localhost:8080 (add to Home Screen on iPhone for instant PWA use).

## Live Google data (optional)
Deploy `server/index.js` with `GOOGLE_API_KEY` (Places API New enabled), then paste its URL in the app's Settings box.
Ranking/GBP-owner-only data needs approved Business Profile API access; Places covers rating, reviews, hours, phone, site.

## App Store note
Apple rejects thin web wrappers. Camera, share sheet, offline storage and workflow value here help; for the store
submission add a real icon/splash and keep it as an internal TestFlight tool if you only use it for your team.
