# @shared/ui-qr-code

> [!CAUTION]
> **Status: UNSTABLE** — New package; pending platform team review for API and placement.

Reusable QR code UI for web and React Native. Encodes a plain string (typically a wallet address)
as a scannable QR with optional center content (e.g. a crypto icon or a logo).

High error correction (`ecl="H"` / `errorCorrectionLevel: "H"`) so a center badge does not break
scanning — same approach as Receive.

## Exports

| Export | Description |
| --- | --- |
| `QrCode` | Styled QR card with an optional center overlay |
| `QrCodeProps` | Component props |

The public API is identical on web and native, so consumers never branch on platform. Only the
renderer differs:

- **web** — [`qrcode`](https://www.npmjs.com/package/qrcode) drawn on a `<canvas>`
- **native** — [`react-native-qrcode-svg`](https://www.npmjs.com/package/react-native-qrcode-svg)

`centerContent` is a free slot: pass any node (a `CryptoIcon`, a logo, an `<img>`, …). The package
only provides the QR matrix and the white circular host in the center.

## Usage

```tsx
import { QrCode } from "@shared/ui-qr-code";
import CryptoIcon from "@ledgerhq/crypto-icons/native";

<QrCode
  value={address}
  testID="my-qr-code"
  centerContent={
    <CryptoIcon ledgerId="bitcoin" ticker="BTC" size={48} shape="circle" />
  }
/>
```
