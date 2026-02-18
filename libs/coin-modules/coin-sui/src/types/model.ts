import type { DeviceModelId } from "@ledgerhq/devices";

export type Resolution = {
  deviceModelId?: DeviceModelId | undefined;
  certificateSignatureKind?: "prod" | "test" | undefined;
  tokenAddress?: string;
  tokenId?: string;
};

export type SuiOperationMode = "send";

export type AccountInfoResponse = Record<string, string>;

export type CoreTransaction = {
  /** The transaction in a serialized format, ready to be signed. */
  unsigned: Uint8Array;

  /** The input objects referenced in the transaction, in serialized form.. */
  objects?: Uint8Array[];

  /* The token resolution for clear signing */
  resolution?: Resolution;
};
