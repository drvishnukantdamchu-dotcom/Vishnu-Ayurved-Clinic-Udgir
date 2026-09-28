# Phase 1: Clinical PWA shell

## Firebase intake sync checkpoint

Settings contains Firebase Email/Password login. `auth.mjs` reads the authenticated UID's role document, refreshes its ID token in memory, and ends the session after 15 minutes or reload. `patientIntakes` is the only collection enabled in the proposed Firestore rules. Students query only their own UID; doctors/owner can read all intakes; students may edit only their own intake. Role profiles remain console-provisioned.

The web form intentionally requires the synthetic-data checkbox and client code refuses to sync IDs outside `VAC-DEMO-*`. Cloud sync must not be used for real patient records yet. Case-taking, prescriptions, Panchakarma, attachments, reports/review queues are not persisted to Firebase. No Firebase Storage, Drive bridge, full backup or restore exists. Student/owner screen controls are not sufficient access control by themselves; Firestore rules enforce the narrow Patient Intake collection boundary.

Before enabling this test: Firebase Console → Firestore Database → Rules, replace rules with `firestore.rules`, Publish; keep `users/<Auth UID>` role and active values correct. The owner UID is already provisioned by the clinic owner. For each test student, create the Auth account and trusted `users/<Auth UID>` document with `role: student` and `active: true`. Client registration cannot grant roles. Put only the public web API key and project ID in `firebase-config.json`; never a service-account private key or password.

Rules need Firebase Emulator/Rules Playground tests and live login/read/write/denial verification after the owner publishes them. The supplied Chromium test exercises the published UI only and never logs into Firebase.

Firebase and Drive configurations are independent. Keep billing disabled and use synthetic records until role revocation, rules, security and restore checks pass.

Demo only. No real patient storage, authentication, Firebase connection, Drive bridge, or backup exists yet. All displayed patients are fictional. Existing public clinic pages are unchanged.

Implemented: responsive clinic-branded dashboard, navigation, sample name/ID/village search, sample case-paper dialog and print stylesheet, month selector, large text mode, online indicator, manifest and static-shell-only service worker. Serve over localhost/HTTPS; file:// cannot install a PWA.

Next: Firebase Spark configuration supplied/authorized by owner, deny-by-default Firestore rules, explicit owner bootstrap, student allowlisting, role tests. Never identify owner by a client-side editable email alone. Drive authentication does not inherit Firebase permissions: design/test a separate authorized file gateway before real uploads. No public report links or owner tokens in clients.

Offline support must be limited to trusted devices. Cached data is not a full backup. Approved clinical records need revision history and conflict review rather than silent last-write-wins. Historical visits retain visit date separately from actual entry timestamp. Reports distinguish visits from unique patients.

Backups need encryption key recovery and tested restore. Closed browsers cannot guarantee background backups. Free quotas can interrupt service; no unlimited-free or emergency-availability guarantee. Production launch requires security, restore, remote-access, print and installation tests.
