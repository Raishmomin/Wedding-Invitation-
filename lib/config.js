/* =========================================================
   EDIT THIS FILE — everything on the invitation comes from here
   ========================================================= */
export const CONFIG = {
  groom: "Raish Ahemad",
  bride: "Falaknaaz",
  initials: ["R", "F"],
  weddingAt: "2026-12-27T10:00:00+05:30",   // Nikah date & time (India time) — drives the dates, calendar and countdown
  musicFile: "",                              // your own song: put music.mp3 in the public folder and write "/music.mp3" here
  defaultGuest: "You & Your Family",
  sealLetters: "dark",                        // the RF on the wax seal: "dark" = dark brown letters, "light" = same tone as the wax
  siteUrl: "",                                // your site's address, e.g. "https://raish-weds-falaknaaz.com" — needed for WhatsApp previews when not hosted on Vercel
  /* THE CELEBRATIONS — one line per event, in order. Copy a line to add another.
     day  = date in the wedding month (puts a heart on the calendar)
     note = optional extra line: venue, dress, what will happen                      */
  events: [
    { day: 27, name: "Nikah", time: "10:00 AM", date: "Sunday, 27 December",  note: "Juni Eidgah Masjid, Salabatpura, Surat" },
    { day: 29, name: "Reception", time: "12:00 PM", date: "Tuesday, 29 December", note: "Hazrat Pir Saiyad Kasim Ali Dargah, Dholka" }
  ]
};

/* the seal picture that goes with sealLetters above (both are made by scripts/emboss.mjs) */
export const SEAL_IMAGE = `/emboss/badge${CONFIG.sealLetters === "dark" ? "-dark" : ""}.webp`;
