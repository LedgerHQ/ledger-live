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

- `Karaoke.Root`: holds the state (which phrase, done or not) and the static glow. Pass `phrases` and `tapLabel`.
- `Karaoke.Sequence`: the phrases and the "tap to continue" hint. Give it an `action` to replace the hint on the last phrase (for example a button).
- `Karaoke.Final`: shown after the last tap, in place of the sequence (for example a pitch screen).
- `karaokeTestIds`: the tap area test ID.
- `KaraokeRootProps`, `KaraokeSequenceProps`, `KaraokeFinalProps`: the platform-neutral props contract.

Anything you render after `Sequence` and `Final` inside `Root` sits above the tap area, like a close bar.

```tsx
import { Karaoke } from "@shared/ui-karaoke/native";

<Karaoke.Root phrases={phrases} tapLabel={t("tapToContinue")}>
  <Karaoke.Sequence action={<Button onPress={onFinish}>{actionLabel}</Button>} />
  <CloseBar onPress={onClose} />
</Karaoke.Root>
```

## Consumers

- Ledger Wallet mobile, device onboarding: the intro karaoke for a new device, and the Recover pitch.
