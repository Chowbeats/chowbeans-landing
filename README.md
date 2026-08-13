# Chowbeans

A fictional coffee roastery landing page, built as a host for a **SocialLadder**
iframe integration. Static HTML/CSS/JS — no build step, no dependencies, no
images. Ready for GitHub Pages.

```
index.html          Landing page (hero, ambassador card, this week's beans)
community.html      Ambassador page — Apply / Sign in, both SocialLadder widgets
assets/css/style.css
assets/js/main.js   Header state + scroll reveals
assets/js/widget.js Placeholder handling around the widget (cosmetic only)
.nojekyll           Tells GitHub Pages to serve the files as-is
```

## The SocialLadder widget

Configured in `community.html`, inside the `<!-- SocialLadder embed -->` block:

| Variable      | Value                                  |
| ------------- | -------------------------------------- |
| `areaGuid`    | `6FADA2AE-122F-4F53-AEBE-B10A0A56F3EA` |
| `appGuid`     | `910BB1F9-9680-4BC3-8FAC-AFF15D4B0EBD` |
| `crmShopName` | `APPLICATIONSHOP1609`                  |

`appGuid`, `campGuid`, `resGuid` and `resetToken` are read from the page URL
when present, so deep links like `community.html?campGuid=...` pass through.

### Apply / Sign in

`community.html` hosts both widgets as tabs, mounted lazily on first open:

| Tab       | Container          | Loader                     |
| --------- | ------------------ | -------------------------- |
| Apply     | `#slWebAppWidget`  | `loadSLApplicationWidget()` |
| Sign in   | `#slWebFrame`      | `loadSLWebFrame()`          |

Apply is the default. `?view=login` opens Sign in directly, and so does any URL
carrying a `resetToken` (password-reset links). Once a tab is mounted it is only
hidden on switch, never destroyed, so a session survives toggling.

## Run locally

```sh
python3 -m http.server 8000
# http://localhost:8000
```

Opening the files directly with `file://` also works, though the SocialLadder
script may behave differently without an HTTP origin.

## Deploy to GitHub Pages

```sh
git add -A
git commit -m "Chowbeans landing page"
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `root`**.
The site lands at `https://<user>.github.io/<repo>/`. All links are relative,
so it works from a subpath without changes.
