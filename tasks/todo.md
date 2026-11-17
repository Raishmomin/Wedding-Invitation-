# Share preview (OG image) + RF favicon

- [x] Bundle the invitation's fonts as TTF in `assets/fonts/` (ImageResponse can't use woff2 / Google CSS)
- [x] `lib/share.js` — shared title/description/OG metadata built from `CONFIG`
- [x] `lib/og.jsx` — RF crest + invitation card drawn with `next/og` (fonts, colours from globals.css)
- [x] `app/opengraph-image.js` — 1200×630 card for the general link
- [x] `app/[guest]/opengraph-image.js` — same card with the guest's name
- [x] `app/icon.js` + `app/apple-icon.js` — RF monogram icons
- [x] Replace default `app/favicon.ico` with RF (16/32/48)
- [x] Layout + guest page metadata: `metadataBase`, `openGraph`, `twitter` card
- [x] Verify: render every image, check `<head>` tags on `/` and `/Rahul-Sharma-and-Family`, `next build`
- [x] README: how the preview works + `siteUrl`
- [x] git init, push to github.com/Raishmomin/Wedding-Invitation- (SSH; HTTPS had no credentials)
- [x] Envelope: printed sprigs → embossed floral paper (user's reference image)

## Review

- All image routes return 200; build passes; fonts traced into the per-guest OG function.
- Satori gotcha: a component must return one element, not an array (fails as "failed to pipe response").
- Favicon needed Bodoni's small-optical-size bold cut; the display cut's hairlines vanish at 16px.
- Not verified: a real WhatsApp share (needs the deployed HTTPS URL).
