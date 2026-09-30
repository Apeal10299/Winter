# Admin password setup (local XAMPP only)

The PHP admin login reads `WARC_ADMIN_PASSWORD` from the root `.htaccess` file. Keep that file out of Git and set a unique password there before using the admin panel at `http://localhost/warc/warc-admin/`.

A previous version of this guide included a sample password. Treat that password as public and do not reuse it. The current static tracker saves only to browser storage and does not write to the PHP database. GitHub Pages does not run this PHP admin panel or protect the tracker with authentication; the Pages workflow excludes the PHP files and admin panel from deployment.

Do not expose the XAMPP/PHP endpoints to the internet without adding authentication and HTTPS protection to the tracker endpoints as well.
