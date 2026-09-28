# Vishnu Ayurved OPD demonstration PWA

Public app: https://drvishnukantdamchu-dotcom.github.io/Vishnu-Ayurved-Clinic-Udgir/opd/

**Synthetic demonstration data only. Do not enter real patient details or clinical documents.** IDs must start with `VAC-DEMO-`. The app is a prototype, not a deployable clinical record system or a reliable emergency-access service.

## Current behavior

- Firebase Email/Password login checks trusted `users/<Auth UID>` role documents; sessions live in memory for 15 minutes or until reload. Only `patientIntakes` has published Firestore permissions. Synthetic patient intakes sync across devices after login; other clinical collections are denied by rules.
- Case-taking, prescription drafts, Panchakarma sessions, follow-up statuses and synthetic PDF/JPG/PNG attachments persist in **this browser's IndexedDB** across refreshes, under the `VAC-DEMO-*` namespace. They do not sync to Firebase or Drive, and browser storage removal/private mode/device loss can erase them. Review queue remains session-only. Attachment max 5 MB, 20 files per demo patient.
- Owner login can download a JSON backup of the browser-local synthetic records, including attachment bytes, and restore it manually from Settings. This is **not an automatic cloud backup**. The downloaded file is unencrypted: do not use it with patient records and store it privately. Restore replaces matching local entries, requires confirmation and reload, and does not restore Firestore intakes.
- A4 case-paper print, search, sample reports and PWA installation work for demonstration. Reports do not count actual clinical visits. No pharmacy, billing, marketing, WhatsApp sending or Firebase Storage integrations.

## Remaining production work

Design and enforce collection-specific owner/doctor/student Firestore rules, server-side identity/approval workflows, immutable visit history and conflict resolution; implement live remote clinical sync, appointment and report queries, secure document storage and an encrypted, verified Drive backup bridge. Test role denial, revoke, restore, mobile use, A4 printing, cross-device synchronization and offline behavior before allowing real patients. Auth role screens alone do not secure data. Firebase web API keys are public identifiers; never ship service-account secrets.

Run `node --test opd/*.test.mjs` from the repo root (or `node --test *.test.mjs` here).
