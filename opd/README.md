# Vishnu Ayurved clinic OPD PWA

Current release: v33. Owner/Doctor email login gates the clinic workspace. Email-free student device workflow is implemented but requires Firebase Anonymous provider and the new owner-controlled device rules. All six text record kinds can sync; report/X-ray blobs remain local. Existing demo data is separate. Local storage and JSON backups are unencrypted; protect clinic devices and backup files. Cross-device and live role validation remain required.

Run `node --test opd/*.test.mjs`.

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

Version 31: optional Owner/Doctor Firestore sync for all clinic text record kinds, with durable dirty markers, pagination, deletion tombstones and update-time conflict prevention. Publish the new full firestore.rules before live use. Attachments remain local; Firebase Storage requires Blaze. Shared browser local records are not isolated by login. No student cloud access. Live cloud validation still required.

Version 32: doctor app is gated by Owner/Doctor authentication before loading local records. Dedicated student.html portal has per-UID local storage, only own intake/examination cloud queries and no prescription/review/backup controls. Student clinical writes require an existing intake owned by the student. Account creation and user role provisioning remain through trusted Firebase Console. Files stay local. Reopening app requires online sign-in; after sign-in local forms continue during connection loss.

## Email-free student devices (v33)
Enable Firebase Authentication Anonymous provider and publish `firestore.rules`. Open `student.html` on the clinic entry device; copy Device ID into Owner Settings > Student entry devices > Approve. Each student enters their name, which is self-declared attribution rather than verified identity. Changing student does not change device authorization. Revoking the ID blocks cloud access, but cannot remotely remove browser-local records. Use trusted clinic devices; clear browser data removes the device credential and local records, so back up/sync first. Anonymous refresh credentials persist in that browser; Owner/Doctor credentials remain in memory. First registration requires internet, later offline entry uses the same local device store. No attachments are uploaded. Device approval cannot change an existing Owner/Doctor role.
