# Phase 1: Clinical PWA shell

## Phase 2 checkpoint

Settings contains a disabled-by-default Firebase login connection tester. `auth.mjs` uses Firebase Auth REST and fetches the authenticated UID's role document. Passwords/tokens are not persisted. The adapter does not yet authorize or load clinical records, refresh sessions, or provision accounts. Fifteen-minute sessions expire; reload logs out. This is not a completed production authentication system.

`node --test opd/auth.test.mjs` runs six mocked tests; they do not replace Firestore emulator rules tests or live integration tests. Browser QA is pending because browser downloads failed.

To connect later: the owner must create/authorize a Firebase Spark project, enable Email/Password authentication, create a test Auth user, deploy `firestore.rules`, and use the trusted console to create `users/<Auth UID>` with `role: owner|student|doctor` and `active: true`. Owner email alone never grants rights. The first owner UID must be confirmed before provisioning. Put only the public web API key and project ID in `firebase-config.json`; never a service-account private key or password. Do not enable until rules are deployed. Rules deny all clinical access and all client-side role writes. Authenticated users can get only their own role record. Student revocation and record-specific rules must be enforced on every future clinical request, not just in UI controls.

No Firebase project, account, rules deployment or Drive folder has been created by this checkpoint. Firebase and Drive configurations are independent. Keep billing disabled and use synthetic records until security/restore verification passes.

Demo only. No real patient storage, authentication, Firebase connection, Drive bridge, or backup exists yet. All displayed patients are fictional. Existing public clinic pages are unchanged.

Implemented: responsive clinic-branded dashboard, navigation, sample name/ID/village search, sample case-paper dialog and print stylesheet, month selector, large text mode, online indicator, manifest and static-shell-only service worker. Serve over localhost/HTTPS; file:// cannot install a PWA.

Next: Firebase Spark configuration supplied/authorized by owner, deny-by-default Firestore rules, explicit owner bootstrap, student allowlisting, role tests. Never identify owner by a client-side editable email alone. Drive authentication does not inherit Firebase permissions: design/test a separate authorized file gateway before real uploads. No public report links or owner tokens in clients.

Offline support must be limited to trusted devices. Cached data is not a full backup. Approved clinical records need revision history and conflict review rather than silent last-write-wins. Historical visits retain visit date separately from actual entry timestamp. Reports distinguish visits from unique patients.

Backups need encryption key recovery and tested restore. Closed browsers cannot guarantee background backups. Free quotas can interrupt service; no unlimited-free or emergency-availability guarantee. Production launch requires security, restore, remote-access, print and installation tests.
