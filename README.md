# Vishnu Ayurved Clinic, Udgir

Live website: https://drvishnukantdamchu-dotcom.github.io/Vishnu-Ayurved-Clinic-Udgir/
Share link: https://tinyurl.com/283r54ws

Static HTML, CSS and JavaScript, published with GitHub Pages. No build step.

## September 2026 design and usability audit

Fixed hidden mobile language control; added visible form labels, phone validation,
keyboard menu state, Escape handling, reduced-motion support and a no-JavaScript
content fallback. Moved trailing scripts inside the document body. Retained both
branches, established contact details and appointment requests through WhatsApp.

Uploaded doctor, header and logo images are stored as optimized WebP assets.
The theme uses deep green, gold, warm ivory and restrained sage/blue accents.
Added a keyboard-accessible photo viewer, sharing with copy-link fallback,
canonical metadata and social preview metadata. Removed a hard-coded review
rating in favour of linking to the current listing. Opening indications describe
scheduled hours, not verified live staffing.

The appointment form opens WhatsApp for the visitor to review and send a request;
it is not a booking backend and does not confirm appointments automatically.
The language control translates key navigation, headings and selected copy;
some supporting content remains bilingual or English.

Local preview: `python -m http.server 8765`

## Ayurveda knowledge centre

`ayurveda.html` adds twelve Marathi/English patient-education topics, with
search and category filters. It opens in Marathi and remains readable without
JavaScript. `knowledge.css` uses locally hosted Baloo 2 headings alongside
Noto Sans Devanagari body text; font licences are in `fonts/`.
References are linked at the bottom of the guide. Traditional frameworks are
identified as such; no automatic diagnosis or medicine prescription is provided.

Verified at desktop and 390px mobile widths: no horizontal overflow, local font
loading, all twelve articles, category filtering, bilingual search, language
switch and empty-search feedback; no JavaScript runtime errors in those checks.
