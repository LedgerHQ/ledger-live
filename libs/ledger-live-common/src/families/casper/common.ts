import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";

export const getPath = (path: string): string =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

// @zondax/ledger-casper swallows every transport error into { returnCode, errorMessage },
// so the typed errors the UI reacts to have to be rebuilt from the return code.
export const deviceError = (r: {
  returnCode: number;
  errorMessage?: string;
}): Error | undefined => {
  switch (r.returnCode) {
    case 0x9000:
      return undefined;
    case 0x6986:
      return new UserRefusedOnDevice();
    case 0x5515:
      return new LockedDeviceError();
    // @zondax/ledger-casper's catch-all: errorMessage is the original error stringified.
    case 0xffff:
      return new Error(r.errorMessage);
    default:
      return new Error(`${r.returnCode} - ${r.errorMessage}`);
  }
};
