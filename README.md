# Raish & Falaknaaz — Wedding Invitation (Next.js)

## Run it

```
npm install
npm run dev
```

Open http://localhost:3000

## Guest links

Add the guest's name to the end of the link, with hyphens for spaces:

| Link | Greets |
|---|---|
| `/` | You & Your Family |
| `/Rahul-Sharma` | Rahul Sharma |
| `/Rahul-Sharma-and-Family` | Rahul Sharma & Family |

## Where things are

| File | What it holds |
|---|---|
| `lib/config.js` | **Edit this.** Names, initials, wedding date and time, the list of celebrations, music file |
| `lib/markup.js` | The invitation's HTML: venues, contact numbers, wording, family name |
| `app/globals.css` | All styles and animations (colours are at the top) |
| `lib/invitation.js` | The script: crest, entrance, countdown, timeline, music |
| `scripts/emboss.mjs` | Draws the envelope's embossed scrollwork, the gold RF emblem and the paper into `public/emboss/` and `public/paper.webp` (run `npm run emboss` after changing it or the initials) |
| `lib/guest.js` | Turns the link ending into a guest name |
| `components/Invitation.jsx` | The component that shows the invitation |
| `app/page.js` | The general link |
| `app/[guest]/page.js` | The personal guest link |

## Add an event to "The celebrations"

In `lib/config.js`, copy a line inside `events` and change it:

```
{ day: 26, name: "Mehndi", time: "7:00 PM", date: "Saturday, 26 December", note: "At home" },
```

## Use your own song

Put `music.mp3` in the `public` folder and set `musicFile: "/music.mp3"` in `lib/config.js`.

## Link preview (WhatsApp, Instagram, Facebook …) and icon

Sharing a link shows a card with the RF crest, both names and the date. A personal link
(`/Rahul-Sharma-and-Family`) shows the guest's name on the card too. The words under the picture
come from `lib/share.js`.

| File | What it holds |
|---|---|
| `lib/og.jsx` | Draws the preview card and the RF icons |
| `app/opengraph-image.js` | Preview for the general link |
| `app/[guest]/opengraph-image.js` | Preview for a personal link |
| `app/icon.js`, `app/apple-icon.js`, `app/favicon.ico` | RF icon for tabs, bookmarks and phone home screens |
| `assets/fonts/` | The invitation's fonts, used to draw the pictures |

On Vercel the preview works by itself. Anywhere else, set `siteUrl` in `lib/config.js` to your site's
address. WhatsApp keeps a preview for a while, so after changing it, test with a fresh link
(for example add `?v=2`).

## Put it online

Push this folder to GitHub, then import the repository at vercel.com.
