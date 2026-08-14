# Chowbeans

A fictional coffee roastery landing page, built as a host for a **SocialLadder**
iframe integration. Static HTML/CSS/JS — no build step, no dependencies, no
images. Ready for GitHub Pages.

```
index.html          Landing page (hero, ambassador card, this week's beans)
community.html      Ambassador page — Apply / Sign in, both SocialLadder widgets
admin.html          Rule editor for the context rail (unlisted)
assets/css/style.css
assets/js/main.js   Header state, scroll reveals, admin easter egg
assets/js/widget.js Tab mounting + the portal postMessage listener
assets/js/rail.js   Rail rule engine and the shipped default rules
assets/js/admin.js  Rule editor
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

## The context rail

Beside the widget we show content that reacts to what the visitor is doing
inside the portal. The portal broadcasts its state with `postMessage`; we
attach our own listener next to SocialLadder's (listeners are additive, so
this changes nothing about how their widget behaves), translate the messages
into a **view** plus an **item name**, and match them against a list of rules.

Rules are matched top to bottom. Every match contributes its blocks, so a
general rule and a specific one stack. A rule can `stop` the ones below it.

| Condition | Meaning |
| --- | --- |
| Views | Which portal views this applies to. None ticked = all of them. |
| Item name | `contains` / `is exactly` / `starts with` / `regex`, optionally negated. Only detail views (`challenge`, `reward`, `thread`) carry a name. |
| Visitor | Signed in, signed out, or either. |

Blocks are `heading`, `text`, `callout`, `steps` and `links`. Any text can use
`{item}` and `{view}` as placeholders.

### Editing the rules

Open **`admin.html`** — or click the small brown dot beside the Chowbeans
wordmark **five times**. It has a live preview: set a view and an item name and
see exactly what the rail will render.

Edits save to `localStorage`, so they are per-browser. To ship them to
everyone, copy the JSON from the export box into `DEFAULTS` in
`assets/js/rail.js` and commit.

### Finding out what the portal sends

`community.html?debug=1` shows the raw event stream in the rail — the view
names and page titles as they arrive. That is how to discover what to write a
rule against.

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
