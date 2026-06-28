# detox-next-gen — team presentation

A short reveal.js deck (7 slides) on three improvements over `e2e/mobile`: the
**element layer**, **timeouts**, and **cross-page flows**. Talking points are in
each slide's speaker notes.

## Present

Open `index.html` in a browser, or serve it for the full feature set (speaker
notes window, hash routing):

```bash
cd e2e/detox-next-gen/presentation
python3 -m http.server 8000
# open http://localhost:8000
```

## Controls

- `←` / `→` / `Space` — navigate
- `S` — open the speaker-notes window (the per-slide talking points)
- `F` — fullscreen · `O` — slide overview · `Esc` — exit

## Notes

- reveal.js loads from a CDN, so presenting needs network access. To go offline,
  `npm i reveal.js` and repoint the `<link>` / `<script>` tags at `node_modules/`.
- This is a point-in-time pitch, **not** part of the test suite — move or delete freely.
