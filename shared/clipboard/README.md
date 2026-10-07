# @shared/clipboard

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Cross-platform copy and paste. The API is identical on web and native, so consumers never branch on
platform:

- **native** — [`expo-clipboard`](https://docs.expo.dev/versions/latest/sdk/clipboard/)
- **web** — `navigator.clipboard`

Neither function throws: a failed or denied clipboard access resolves to `false` / `""`.

## Exports

| Export            | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `copyToClipboard` | `(text: string) => Promise<boolean>` — `true` once copied   |
| `readClipboard`   | `() => Promise<string>` — the clipboard text, `""` if none  |

## Usage

```ts
import { copyToClipboard, readClipboard } from "@shared/clipboard";

const copied = await copyToClipboard(address);
const pasted = (await readClipboard()).trim();
```

## Desktop

Ledger Wallet desktop denies web clipboard permission checks, so `readClipboard` resolves `""` there.
Writes work. Code that must read the clipboard on desktop goes through Electron's `clipboard`.

## Testing

On native, `expo-clipboard` needs a native runtime: map `^expo-clipboard$` to a stub in the
consumer's jest config. Tests asserting on copy/paste should `jest.mock("@shared/clipboard")`.
