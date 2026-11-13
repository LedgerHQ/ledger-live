# @shared/ui-karaoke

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

A tap-through story: one phrase at a time, the user taps to see the next one. The old phrase moves up, turns gray and gets smaller.

## Entries

| Entry | Status |
| --- | --- |
| `@shared/ui-karaoke/native` | React Native implementation (`src/native/`) |
| `@shared/ui-karaoke/web` | Not yet. It will implement the same props contract (`src/Karaoke.types.ts`) in `src/web/`; then both become one universal entry. |

## Exports

- `Karaoke.Root`: holds the state (which phrase, done or not) and the glow (`@shared/ui-glow`). Pass `phrases`, `tapLabel`, and an optional `action` that replaces the hint on the last phrase (for example a button). Then the top glow fades out while the bottom glow fades in: at once when the action shows, or 2 s after a `Final` shows, once its title is read.
- `Karaoke.Sequence`: the phrases and the "tap to continue" hint (or the `action`).
- `Karaoke.Final`: shown after the last tap, in place of the sequence (for example a pitch screen).
- `karaokeTestIds`: the tap area test ID.
- `KaraokeRootProps`, `KaraokeFinalProps`: the platform-neutral props contract.

Anything you render after `Sequence` and `Final` inside `Root` sits above the tap area, like a close bar.

```tsx
import { Karaoke } from "@shared/ui-karaoke/native";

<Karaoke.Root
  phrases={phrases}
  tapLabel={t("tapToContinue")}
  action={<Button onPress={onFinish}>{actionLabel}</Button>}
>
  <Karaoke.Sequence />
  <CloseBar onPress={onClose} />
</Karaoke.Root>
```

## Consumers

- Ledger Wallet mobile, device onboarding: the intro karaoke for a new device, and the Recover pitch.
