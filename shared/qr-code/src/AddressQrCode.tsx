import type { AddressQrCodeProps } from "./types";

// The props and the `never` return are load-bearing, not decoration: tsc ignores the `react-native`
// export condition, so this web stub is the signature every consumer typechecks against — including
// the `.native` ones that actually render the component. Dropping either breaks them with TS2786
// and TS2322.
export function AddressQrCode(_props: AddressQrCodeProps): never {
  throw new Error("@shared/qr-code: AddressQrCode is only available on React Native.");
}
