/**
 * The `meta` key a Live App sets on `transaction.sign`, `transaction.signAndBroadcast` and
 * `message.sign` to group its sign requests, e.g. by WalletConnect session topic.
 */
export const SIGNATURE_REQUEST_GROUP_META_KEY = "requestGroupId";

export type SignatureCancelParams = {
  /** The group whose pending sign requests are cancelled. */
  requestGroupId: string;
};

export type SignatureCancelResponse = {
  /** How many pending sign requests were cancelled. */
  cancelled: number;
};

export type MethodIds = "custom.signature.cancel";
