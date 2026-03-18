---
applyTo: "**/src/mvvm/**"
---

# MVVM Architecture

All code inside `src/mvvm/` must follow these rules strictly.

## Folder Structure

src/mvvm/
├── features/FeatureName/
│   ├── __integrations__/    ← mandatory integration tests
│   ├── components/          ← reusable UI across screens
│   ├── screens/             ← individual screen folders
│   ├── hooks/               ← feature-specific hooks
│   └── utils/               ← feature-scoped utilities
├── components/              ← global shared UI
├── hooks/
└── utils/
## ViewModel Pattern

Components needing external logic must use **Container → ViewModel → View**:

- Every screen or component folder must contain a `use<Name>ViewModel.ts` file.
- The View (`index.tsx`) must receive data only through props — never import `useSelector`, `useDispatch`, `useNavigation`, or RTK Query hooks directly.
- The ViewModel centralizes all external hook calls.

## Component Patterns

- Each component resides in its own folder with `index.tsx` as the entry file.
- Split components over 300 lines into separate files.
- Keep screen-specific building blocks inside the screen folder.

## Import Rules

- Keep relative imports shallow (within one directory level).
- Use TypeScript path aliases for broader access.
- Do not import `index.tsx` explicitly.

## Lumen Design System

- Desktop: import from `@ledgerhq/lumen-ui-react`.
- Mobile: import from `@ledgerhq/lumen-ui-rnative`.
- Never use raw HTML elements or React Native primitives when a Lumen component exists.
- Never use inline styles or hardcoded colors — use design tokens.

## Testing

- Every feature must include an integration test in `__integrations__/`.
- Use MSW for network mocking — never mock React components or hooks directly.
- Follow the MVVM pattern to make components testable without mocking hooks.
