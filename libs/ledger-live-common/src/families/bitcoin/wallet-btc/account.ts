import { DerivationModes } from "./types";
import { Currency } from "./crypto/types";
import Xpub from "./xpub";

export interface Account {
  params: {
    path: string;
    index: number;
    currency: Currency;
    network: "mainnet" | "testnet";
    derivationMode: DerivationModes;
    explorer: "ledgerv3" | "ledgerv2";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    explorerURI: string;
    storage: "mock";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageParams: any[];
  };

  xpub: Xpub;
}

export interface SerializedAccount {
  params: {
    path: string;
    index: number;
    currency: Currency;
    network: "mainnet" | "testnet";
    derivationMode: DerivationModes;
    explorer: "ledgerv3" | "ledgerv2";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    explorerURI: string;
    storage: "mock";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storageParams: any[];
  };

  xpub: {
    xpub: string;
    data: unknown;
  };
}
