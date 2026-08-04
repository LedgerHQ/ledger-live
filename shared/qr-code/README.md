# @shared/qr-code

> [!CAUTION]
> **Status: UNSTABLE** — New package; pending platform team review for API and placement.

Reusable address QR code UI for React Native. Encodes a plain string (typically a wallet address) as a scannable QR with optional center content (e.g. a crypto icon).

Built with `react-native-qrcode-svg` and high error correction (`ecl="H"`) so a center badge does not break scanning — same approach as Receive.

## Exports (native)

| Export | Description |
| --- | --- |
| `AddressQrCode` | Styled QR card with optional center overlay |

## Usage

```tsx
import { AddressQrCode } from "@shared/qr-code";
import CryptoIcon from "@ledgerhq/crypto-icons/native";

<AddressQrCode
  value={address}
  testID="my-qr-code"
  centerContent={
    <CryptoIcon ledgerId="bitcoin" ticker="BTC" size={48} shape="circle" />
  }
/>
```

Web export is not implemented yet.
