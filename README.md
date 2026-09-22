# Masjid Adam Islamic Centre — website

A fast, static website for Masjid Adam (1759 Bloor Street East, Mississauga) with automatic prayer times, a printable monthly timetable, announcements, programs, a visitor guide, donations and a password-protected admin page.

## Pages

| Page | What it does |
| --- | --- |
| `/` | Home: today's adhan and iqamah times, next prayer countdown, the day's sun arc, about, programs, announcements, donate, map |
| `/prayer-times.html` | Today's card, Jumu'ah times, a full monthly table (any month) and a **Print** button that produces a clean one-page timetable |
| `/programs.html` | Classes and services |
| `/announcements.html` | Notices with optional posters |
| `/learn.html` | Visitor guide, the five prayers, adhan vs iqamah, wudu, Jumu'ah, Ramadan and Eid, upcoming Islamic dates, glossary |
| `/donate.html` | Interac e-Transfer, cash/cheque, optional online link, where the money goes |
| `/contact.html` | Address, entrance and parking notes, phone numbers, map |
| `/admin/` | Password-protected editor for everything above |

## How prayer times work

- **Adhan times** are calculated in the browser for the masjid's coordinates (ISNA method, Hanafi Asr by default, with small per-prayer offsets so they match the masjid's existing timetable). Nothing to update.
- **Iqamah (jama'ah) times** are set in the admin as a list of rules: *from this date, Fajr 6:00, Dhuhr 2:00, Asr 5:45, Maghrib +5, Isha 9:00*. Each rule applies until the next one. `+5` means five minutes after the adhan.
- **Hijri dates** come from the browser's Umm al-Qura calendar, with a ±day adjustment in the admin for moon sightings.

## Editing the site (admin)

1. Open `/admin/`. The first time on a device you choose a password (it protects the admin on that device).
2. Edit anything — changes save as a draft in that browser and show in the live preview.
3. To publish, connect GitHub once in **Settings**: create a fine-grained personal access token with *Contents: Read and write* for this repository, paste it in, and press **Save token**. It is stored encrypted with your password on that device only.
4. Press **Publish**. The admin commits `data/site.json` (and any uploaded images to `data/uploads/`) and GitHub Pages updates in about a minute.

You can also download `data/site.json` from Settings as a backup, or edit it directly in this repository.

## Running locally

Any static server works, for example `python3 -m http.server 8000` and open `http://localhost:8000/`.
