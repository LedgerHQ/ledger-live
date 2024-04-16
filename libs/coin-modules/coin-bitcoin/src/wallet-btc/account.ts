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
  };

  xpub: {
    xpub: string;
    data: unknown;
  };
}
