import "./globals.css";
import { CONFIG } from "@/lib/config";
import { SITE_TITLE, shareMetadata } from "@/lib/share";

export const metadata = {
  // Share previews need full image links. On Vercel this is found automatically; elsewhere set siteUrl in lib/config.js.
  metadataBase: CONFIG.siteUrl ? new URL(CONFIG.siteUrl) : null,
  ...shareMetadata(SITE_TITLE),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/paper.webp" as="image" type="image/webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,500&family=Mrs+Saint+Delafield&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
