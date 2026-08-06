import { loadAccountRawAssignForFamily } from "../../coin-modules/registry";
import type { AccountRawAssignHooks } from "./types";
import { frameworkExtraFromRaw, frameworkExtraToRaw, mergeExtra } from "./utils";

export async function getAccountRawAssignHooks(network: string): Promise<AccountRawAssignHooks> {
  const hooks = (await loadAccountRawAssignForFamily(network)) ?? {};
  const familyFromRaw = hooks.fromOperationExtraRaw;
  const familyToRaw = hooks.toOperationExtraRaw;
  // The serialization layer replaces `Operation.extra` wholesale with what these hooks return, so a
  // family that maps only its own keys would drop `ledgerOpType`, `memo` and `stake` — whose `amount`
  // is a `BigNumber` that survives a JSON round trip as a bare decimal string (bignumber.js sets
  // `toJSON = toString`) and so revives as a `string`, not a `BigNumber`, unless the framework
  // converts it here.
  //
  // Both directions are wrapped as soon as *either* family hook exists: the layer gates each
  // direction on its own hook, so wrapping per-direction would convert `stake.amount` on one side
  // only and leave the other reviving a string (or persisting a `BigNumber`).
  if (!familyFromRaw && !familyToRaw) return hooks;
  return {
    ...hooks,
    fromOperationExtraRaw: extraRaw =>
      mergeExtra(extraRaw, familyFromRaw?.(extraRaw), frameworkExtraFromRaw(extraRaw)),
    toOperationExtraRaw: extra =>
      mergeExtra(extra, familyToRaw?.(extra), frameworkExtraToRaw(extra)),
  };
}
