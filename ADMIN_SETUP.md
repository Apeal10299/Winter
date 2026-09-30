# Admin password setup (XAMPP)

The admin login reads `WARC_ADMIN_PASSWORD` from the root `.htaccess` file. That local file is ignored by Git and the password is checked only by PHP, not exposed in the admin page's JavaScript.

The configured password is `admin123`. To change it, update the `WARC_ADMIN_PASSWORD` value in `.htaccess` and restart Apache.

The admin login is available at `http://localhost/warc/warc-admin/`. `admin123` is weak; replace it with a unique password before exposing the app beyond localhost. For internet-facing deployment, use HTTPS and protect the tracker endpoints as well; the daily tracker is designed to remain accessible without signing in.
