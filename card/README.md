# Card

The **Ledger Live Card platform** — a lightweight component host embedded in the Pay tab of the Desktop and Mobile apps. Teams add components in one place and they appear in-app automatically.

## Package structure

```
card/
├── shell/         # @card/shell — <Card /> host that renders every registered component
└── components/    # @card/components — one folder per component + the registry the shell reads
```

**All packages must have `"private": true`.**

## How it works

```
host app (PayTab) ──renders──▶ <Card /> (@card/shell) ──reads──▶ @card/components ──loader()──▶ card component
```

- `@card/components` lists its components in a static registry in its barrel (`src/index.ts`): each entry pairs an `id` with a `loader` that lazy-loads the component via a static `import()`, code-split by the bundler.
- Both host apps bundle with Rspack (desktop `@rspack/core`, mobile `@callstack/repack`), so the static `import()` loaders resolve on both — no Metro/codegen needed.
- `@card/shell`'s `<Card />` renders every registered component for the current platform (`React.lazy` + `<Suspense>`). It takes no config.
- Components are self-contained: their `index` Container default-exports a React component with no required props and reads its own data via its ViewModel. They never import the shell.

## Add a component

Create a folder `components/src/<name>/` following the MVVM structure below, then add one registry entry in `components/src/index.ts`:

```ts
{ id: "<name>", loader: () => import("./<name>") }
```

No new package, no `pnpm install`, no app changes.

```
components/src/<name>/
├── index.tsx                # Container (platform-agnostic): const vm = use<Name>ViewModel(); return <NameView {...vm} />
├── use<Name>ViewModel.ts    # ViewModel: data + handlers (react-redux, RTK Query, @shared/* hooks)
├── <Name>View.web.tsx       # View (web): props-only, no external hook calls
├── <Name>View.native.tsx    # View (native): props-only
└── types.ts                 # View props / ViewModel return type
```

The Container is platform-agnostic; the `.web` / `.native` split lives in the View, resolved by the bundler. The component `id` (and React key) is the registry entry's `id`. See `components/src/playground/` for a working template.

## Rebuilds

Editing an existing component needs no rebuild (HMR). Adding or removing a component means adding or removing its registry entry in `components/src/index.ts`, picked up on the next build/refresh — nothing to regenerate.

## Styling

Web components rely on the host's Tailwind build: the desktop `tailwind.config` `content` includes `card/**/src/**/*.{ts,tsx}` and extends the Lumen `ledgerLivePreset`. Native components use `@ledgerhq/lumen-ui-rnative`.
