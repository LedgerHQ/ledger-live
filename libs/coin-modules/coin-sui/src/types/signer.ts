import type Sui from "@ledgerhq/hw-app-sui";

export type SuiAddress = {
  pubKey: string;
  address: string;
  return_code: number;
};
export type SuiSignature = {
  signature: null | string;
  return_code: number;
};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SuiSigner extends Sui {}
