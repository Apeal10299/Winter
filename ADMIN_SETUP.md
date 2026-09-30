# Static admin panel

The GitHub Pages admin panel and tracker use the same screen-lock password. Keep `ADMIN_PASSWORD` in `warc-admin/admin.js` and `TRACKER_PASSWORD` in `script.js` in sync when changing it.

This password is part of the public website source and can be viewed or bypassed. It is not suitable for protecting private data. The admin panel only reads records saved in local storage by the tracker in the same browser profile. It does not use the PHP API or database.

Real authentication and shared records across devices require a backend server.
