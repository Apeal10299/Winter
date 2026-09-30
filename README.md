# Winter Arc 9

## GitHub Pages

This repository deploys the tracker and its client-side admin screen as a static site. The Pages workflow publishes the HTML, JavaScript, and CSS files; it does not run or publish the PHP API or SQLite database.

To publish it:

1. Push this repository to GitHub on the `main` or `master` branch.
2. In the repository, open **Settings > Pages** and set the build and deployment source to **GitHub Actions**.
3. Open the Pages URL shown in the repository settings after the workflow completes.

Progress and calendar history are saved in the browser's local storage, using Nepal time for daily records and refreshing after midnight in Kathmandu. The admin screen reads records from that same browser profile, so it will not show data saved on another device or browser. Clearing browser site data removes the records.

Use **Save backup file** to export a JSON backup and choose where to save it, then **Restore backup** to import it later. Live autosaves still go to browser storage; the backup file is a separate copy. Browsers without a file-save picker download the backup using their normal download settings.

The tracker and admin screen use a client-side convenience lock. Keep `TRACKER_PASSWORD` in `script.js` and `ADMIN_PASSWORD` in `warc-admin/admin.js` in sync when changing it. Because this is a public GitHub Pages site, anyone can read the password in the JavaScript or bypass the login. This lock is not security and must not be used to protect private data.

## PHP files

The PHP and SQLite backend files are retained in the repository but are not used by the GitHub Pages tracker or admin screen. Shared data across devices and real authentication require a separate backend server.
