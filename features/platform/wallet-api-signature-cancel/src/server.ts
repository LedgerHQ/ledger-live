import { type RPCHandler, customWrapper } from "@ledgerhq/wallet-api-server";
import {
  type MethodIds,
  SIGNATURE_REQUEST_GROUP_META_KEY,
  type SignatureCancelParams,
  type SignatureCancelResponse,
} from "./types";

type Handlers = Record<MethodIds, RPCHandler<SignatureCancelResponse, SignatureCancelParams>>;

/** The request group of a sign request, read from its `meta`. */
export function getSignatureRequestGroupId(meta: unknown): string | undefined {
  if (typeof meta !== "object" || meta === null) return undefined;
  const requestGroupId: unknown = Reflect.get(meta, SIGNATURE_REQUEST_GROUP_META_KEY);
  return typeof requestGroupId === "string" && requestGroupId !== "" ? requestGroupId : undefined;
}

export const handlers = ({
  cancelSignatures,
}: {
  /** Rejects the pending sign requests of the group and returns how many there were. */
  cancelSignatures: (requestGroupId: string) => number;
}) => {
  const wrappedHandler = customWrapper<SignatureCancelParams, SignatureCancelResponse>(params => {
    const requestGroupId = getSignatureRequestGroupId(params);
    if (!requestGroupId) {
      throw new Error(
        `custom.signature.cancel expects a non-empty ${SIGNATURE_REQUEST_GROUP_META_KEY}`,
      );
    }
    return { cancelled: cancelSignatures(requestGroupId) };
  });

  return {
    "custom.signature.cancel": wrappedHandler,
  } as const satisfies Handlers;
};
