# Winter Arc 9

## GitHub Pages

This repository deploys the tracker and its client-side admin screen as a static site. The Pages workflow publishes the HTML, JavaScript, and CSS files; it does not run or publish the PHP API or SQLite database.

To publish it:

1. Push this repository to GitHub on the `main` or `master` branch.
2. In the repository, open **Settings > Pages** and set the build and deployment source to **GitHub Actions**.
3. Open the Pages URL shown in the repository settings after the workflow completes.

Progress and calendar history are saved in the browser's local storage. The admin screen reads records from that same browser profile, so it will not show data saved on another device or browser. Clearing browser site data removes the records.

The admin password is `admin123`, set in `warc-admin/admin.js`. Because this is a public GitHub Pages site, anyone can read the password in the JavaScript or bypass the login. It is only a convenience screen lock, not security. Do not use it to protect private data.

## PHP files

The PHP and SQLite backend files are retained in the repository but are not used by the GitHub Pages tracker or admin screen. Shared data across devices and real authentication require a separate backend server.
