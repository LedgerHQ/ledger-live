export type ZcashAppConfig = {
  version: string;
};

export type ZcashAddress = {
  publicKey: string;
  address: string;
  chainCode: string;
};

export type ZcashViewKey = {
  viewKey: string;
};

export type ZcashTrustedInput = {
  trustedInput: string;
};

export type ZcashSignerEventType =
  | "signer.zcash.loading-context"
  | "signer.zcash.signing"
  | "signer.zcash.signed";

export type ZcashSignature = {
  s: string;
  v: string | number;
  r: string;
};

export type ZcashSignerEvent =
  | {
      type: Exclude<ZcashSignerEventType, "signer.zcash.signed">;
    }
  | {
      type: "signer.zcash.signed";
      value: ZcashSignature;
    };

export type ZcashSigner = {
  getAppConfig: () => Promise<ZcashAppConfig>;
  getAddress: (path: string, display?: boolean) => Promise<ZcashAddress>;
  getFullViewingKey: (path: string) => Promise<ZcashViewKey>;
  signTransaction: (path: string, rawTxHex: string) => Promise<ZcashSignerEvent>;
  signMessage: (path: string, messageHex: string) => Promise<ZcashSignerEvent>;
};
