import type Eth from "@ledgerhq/hw-app-eth";

export type EvmAddress = {
  publicKey: string;
  address: string;
  chainCode?: string;
};

export type EvmSignature = {
  s: string;
  v: string | number;
  r: string;
};

export interface EvmSigner extends Eth {}
