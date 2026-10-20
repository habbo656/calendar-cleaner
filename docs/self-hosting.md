# Running locally & self-hosting

The app is a folder of static files. You need a Google OAuth **client ID** for every
origin you serve it from (see "Google Cloud setup" in `docs/owner-setup.md`; add your
origin, e.g. `https://cal.example.com` or `http://localhost:5173`, under
_Authorized JavaScript origins_).

## Try without Google

```sh
npm ci
npm run dev:mock        # http://localhost:5173/?mock — fake calendar, nothing real is touched
```

## Local, against your real calendar

```sh
cp .env.example .env.local   # set VITE_GOOGLE_CLIENT_ID=… (or paste it in the UI later)
npm run dev                  # http://localhost:5173
```

## Any static web server

```sh
npm ci && npm run build
echo '{"googleClientId":"<your-id>.apps.googleusercontent.com"}' > dist/config.json
# copy dist/ to nginx, Apache, Caddy, S3, Netlify, … — any sub-path works
```

## Docker

```sh
docker build -t calendar-cleaner .
docker run -p 8080:80 \
  -v "$PWD/my-config.json:/usr/share/nginx/html/config.json:ro" \
  calendar-cleaner
# → http://localhost:8080
```

## Without any configuration

If no client ID is configured, the sign-in screen asks for one and remembers it in the
browser. You can also pass `?clientId=…` in the URL.
