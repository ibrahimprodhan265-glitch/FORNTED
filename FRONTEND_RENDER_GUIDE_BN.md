# Hyper Regedit Frontend - Render Static Site

এই folder-টা আলাদা GitHub repo হিসেবে upload করবেন।

## এই repo কী

এটা শুধু frontend website:

- User app: `/app`
- Admin panel: `/admin`
- Dark purple neon UI
- PWA manifest
- iPhone icon PNG
- iPhone Web Clip `.mobileconfig`
- Admin panel থেকে app icon এবং login background image update

Admin panel এখানেই থাকবে:

```text
https://your-frontend.onrender.com/admin
```

কিন্তু admin login/API data আসবে backend service থেকে।

## GitHub Upload

এই folder-এর সব file GitHub repo-তে upload করবেন:

```text
hyper-regedit-frontend-render
```

Upload করবেন:

```text
public
scripts
src
.env.example
.gitignore
FRONTEND_RENDER_GUIDE_BN.md
index.html
package.json
postcss.config.js
render.yaml
tailwind.config.js
vite.config.js
```

Upload করবেন না:

```text
node_modules
dist
.env
```

## Render Deploy

Render Dashboard > New > Static Site

Settings:

```text
Root Directory: blank রাখবেন
Build Command: npm install && npm run build
Publish Directory: dist
```

Environment Variable:

```text
VITE_API_URL=https://your-backend-service.onrender.com
```

Rewrite rule:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

এই rewrite না দিলে `/app` বা `/admin` refresh করলে 404 আসতে পারে।

## Backend URL কোথায় বসাবেন

Backend deploy হওয়ার পর URL পাবেন:

```text
https://your-backend-service.onrender.com
```

Frontend Render Static Site-এর Environment tab-এ বসাবেন:

```text
VITE_API_URL=https://your-backend-service.onrender.com
```

তারপর frontend redeploy করবেন।

## Open URL

User app:

```text
https://your-frontend.onrender.com/app
```

Admin panel:

```text
https://your-frontend.onrender.com/admin
```

Default admin:

```text
Username: admin
Password: ADMIN-2026
```

Installed iPhone Web Clip/PWA থেকে user login page খুললে `Admin Panel` button দেখাবে না। Normal browser website-এ `/admin` panel থাকবে।

## iPhone Web Clip

Frontend deploy হওয়ার পর এই command run করুন:

```powershell
.\scripts\update-mobileconfig.ps1 -AppUrl "https://your-frontend.onrender.com/app"
```

Updated file:

```text
public/hyper-regedit-webclip.mobileconfig
```

এই file iPhone-এ open/install করলে Home Screen icon তৈরি হবে।

## Official Docs

- Render Static Sites: https://render.com/docs/static-sites/
- Render Static Site rewrites: https://render.com/docs/redirects-rewrites/
