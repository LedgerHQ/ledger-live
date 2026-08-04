---
"@ledgerhq/native-ui": minor
---

Declare `./assets/icons` explicitly in `exports`, drop the unused `stylis` dependency and remove four files that had no consumer left: `src/icons/Close.tsx`, `src/styles/InvertTheme.tsx`, `storybook/stories/index.ts` and `storybook/constants/globalStyles.ts`
