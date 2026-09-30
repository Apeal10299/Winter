# Winter Arc 9

## GitHub Pages

This repository deploys the tracker as a static site. The Pages workflow publishes only `index.html`, `script.js`, and `style.css`; it does not publish or run the PHP API, SQLite database, or admin panel.

To publish it:

1. Push this repository to GitHub on the `main` or `master` branch.
2. In the repository, open **Settings > Pages** and set the build and deployment source to **GitHub Actions**.
3. Open the Pages URL shown in the repository settings after the workflow completes.

Progress and calendar history are saved in the browser's local storage. They are private to that browser profile and do not sync to other devices or browsers. Clearing browser site data removes them. Do not enter information you need to keep confidential on a publicly accessible tracker.

## PHP files

The PHP and SQLite backend files are retained in the repository but are not used by the static tracker or included in the Pages deployment. The PHP admin panel can only run on a PHP-enabled server and may show legacy database records. See [ADMIN_SETUP.md](ADMIN_SETUP.md) before enabling that endpoint.
