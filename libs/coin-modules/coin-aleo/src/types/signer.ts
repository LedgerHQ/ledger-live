export interface AleoAppConfig {
  version: string;
}

export interface AleoAddress {
  address: string;
}

export interface AleoViewKey {
  viewKey: string;
}

export interface AleoTvk {
  tvk: Uint8Array<ArrayBufferLike>;
}

export interface AleoRootIntentSignature {
  signature: string;
}

export interface AleoFeeIntentSignature {
  signature: string;
}

export interface AleoNestedCallSignature {
  signature: string;
}

export interface AleoSigner {
  getAppConfig: () => Promise<AleoAppConfig>;
  getAddress: (path: string, display?: boolean) => Promise<AleoAddress>;
  getViewKey: (path: string) => Promise<AleoViewKey>;
  getTvk: (path: string, transitionIndex?: number) => Promise<AleoTvk>;
  signRootIntent(path: string, rootIntent: Buffer): Promise<AleoRootIntentSignature>;
  signFeeIntent(feeIntent: Buffer): Promise<AleoFeeIntentSignature>;
  signNestedCall(nestedCallRequest: Buffer): Promise<AleoNestedCallSignature>;
}
