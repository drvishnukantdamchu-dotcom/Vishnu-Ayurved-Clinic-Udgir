# Vishnu Ayurved OPD demonstration PWA

Public app: https://drvishnukantdamchu-dotcom.github.io/Vishnu-Ayurved-Clinic-Udgir/opd/

**Synthetic demonstration data only. Do not enter real patient details or clinical documents.** IDs must start with `VAC-DEMO-`. The app is a prototype, not a deployable clinical record system or a reliable emergency-access service.

## Current behavior

- Firebase Email/Password login checks trusted `users/<Auth UID>` role documents; sessions live in memory for 15 minutes or until reload. `patientIntakes` has published Firestore permissions. `demoClinical` rules have been published and synthetic case sync was verified. The updated `demoPrescriptions` rules in `firestore.rules` must be published before remote prescription sync works. Student case drafts write only under their own UID; the client avoids a read-first check that the rules deny for absent student-owned drafts. Synthetic patient intakes sync across devices after login; prescriptions and other clinical collections remain denied by rules.
- Panchakarma sessions and follow-up statuses and synthetic PDF/JPG/PNG attachments persist in **this browser's IndexedDB** across refreshes, under the `VAC-DEMO-*` namespace. Synthetic case-taking drafts sync to Firebase. Synthetic prescription drafts will sync only for owner/doctor after the prescription rules are published; the remaining local data does not sync to Firebase or Drive, and browser storage removal/private mode/device loss can erase them. Review queue remains session-only. Attachment max 5 MB, 20 files per demo patient.
- Owner login can download a JSON backup of the browser-local synthetic records, including attachment bytes, and restore it manually from Settings. This is **not an automatic cloud backup**. The downloaded file is unencrypted: do not use it with patient records and store it privately. Restore replaces matching local entries, requires confirmation and reload, and does not restore Firestore intakes.
- A4 case-paper print, search, sample reports and PWA installation work for demonstration. Reports do not count actual clinical visits. No pharmacy, billing, marketing, WhatsApp sending or Firebase Storage integrations.

## Remaining production work

Design and enforce collection-specific owner/doctor/student Firestore rules, server-side identity/approval workflows, immutable visit history and conflict resolution; extend remote clinical sync to remaining records, appointment and report queries, secure document storage and an encrypted, verified Drive backup bridge. Test role denial, revoke, restore, mobile use, A4 printing, cross-device synchronization and offline behavior before allowing real patients. Auth role screens alone do not secure data. Firebase web API keys are public identifiers; never ship service-account secrets.

Run `node --test opd/*.test.mjs` from the repo root (or `node --test *.test.mjs` here).

## Report improvements (v21)

The initial month now sets inclusive date bounds. Screen, CSV and print share the same sorted filters, including mobile search. Empty/invalid ranges disable export and print. A4 report styling includes clinic identity, selected dates and repeating table headings. Counts represent loaded intake records, not a longitudinal visit ledger. Cloud intake updates refresh existing report rows without duplicating the queue. CSV text beginning with spreadsheet formula operators is neutralized.

## Cloud sync diagnostics (v24)

Updated PWA cache keys and corrected settings/intake copy to match the tested Firebase intake and case-taking sync. Prescription sync requires the `demoPrescriptions` Firestore rules. The clinical editor explains how to open a saved synthetic draft on another signed-in device. Firebase REST errors retain a sanitized status code in the UI (for example, `PERMISSION_DENIED`, `NOT_FOUND`, or `NETWORK_ERROR`) and login maps common configuration and account failures to a direct message. Do not share passwords, tokens, patient data, or full Firebase response bodies in support messages. This client-side change cannot publish Firestore rules; re-test each role after the Console rules are deployed.


## Durable intake retry (v25)

New intakes require login and are written to IndexedDB before upload. Pending rows survive refresh and are retried on login, reconnect, or the sync button, using their original ID and submitting UID. Each cloud create uses an exists=false precondition; a previously saved record is read back instead of overwritten on a retry. Failed records remain pending and do not block subsequent rows. Logout/reload clears the in-memory workspace. Pending intakes are included in the manual JSON backup, which remains an unencrypted synthetic-data backup.

This is still a synthetic-only prototype. This change does not complete prescription rule deployment, longitudinal visit history, attachments/Panchakarma cloud sync, or automated Drive backup. Automated tests cover retry failure, account isolation, session changes, and an existing remote record; live multi-device/offline validation remains required.


Version 27: English interface, clinical labels, print text, validation and CSV headings. Existing visit-type and gender values remain compatible with Firestore. Original Marathi artwork and user-entered content are retained. Production clinical workflows and cloud validation remain incomplete.

Version 28: local review entries and notes persist in IndexedDB and manual backup. Review marking requires a signed-in Owner or Doctor in the UI. This is not cloud review or clinical approval.

Version 29: user-requested offline mode. Firebase login and sync are disconnected from the app entry point. Local intake persists after reload; case taking, prescriptions, review, follow-ups, Panchakarma, attachments, backup and restore require no login. Device-local storage is not encrypted and there is no multi-user access control. Existing Firebase records were not deleted or imported. This remains a synthetic demo.

Version 30: personal offline clinic workspace with empty initial patient list, date-based VAC-OPD IDs and a separate clinic database/backup format. Previous synthetic records remain untouched in their separate database. No cloud sync, accounts, encryption or digital signatures. Not a claim of completed multi-user clinic software.
