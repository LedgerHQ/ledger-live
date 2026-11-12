import type { AccountReceive, ReceiveAddress } from "@domain/entity-account-receive";
import {
  DEFAULT_RECEIVE_FAMILY_TRAITS,
  type ReceiveAddressOption,
  type ReceiveFamilyConfig,
  type ReceiveFamilyTraits,
  type ReceiveGate,
  type ReceiveVerificationMode,
} from "../types";

type TraitsParams = Readonly<{
  family: string;
  familyConfig?: Partial<ReceiveFamilyTraits>;
  /** `excludedFamilies` param of the `newReceiveFlow` flag: rollout fallback to legacy. */
  excludedFamilies?: readonly string[];
}>;

export function resolveReceiveFamilyTraits({
  family,
  familyConfig,
  excludedFamilies = [],
}: TraitsParams): ReceiveFamilyTraits {
  const traits = { ...DEFAULT_RECEIVE_FAMILY_TRAITS, ...familyConfig };
  return excludedFamilies.includes(family) ? { ...traits, isSupported: false } : traits;
}

/** The new receive screens only verify an address the device derives and shows (`getAddress`). */
function verificationOf({ verification }: ReceiveAddress): ReceiveVerificationMode {
  return verification?.type === "address" ? "device" : "unavailable";
}

/** `receive` and `gate` are absent while they are read: nothing can be verified yet. */
type ConfigParams = TraitsParams &
  Readonly<{ receive?: AccountReceive; gate?: ReceiveGate | null }>;

export function resolveReceiveFamilyConfig({
  receive,
  gate,
  ...params
}: ConfigParams): ReceiveFamilyConfig {
  const traits = resolveReceiveFamilyTraits(params);
  const activationKind = gate && "method" in gate ? gate.method : undefined;
  if (!receive) {
    return { ...traits, verification: "unavailable", activationKind };
  }
  const verification = verificationOf(receive);
  const memoType = receive.memo?.type;
  if (!receive.shielded) return { ...traits, verification, memoType, activationKind };

  const addressOptions: ReceiveAddressOption[] = [
    {
      id: "transparent",
      address: receive.address,
      verification,
      memoType,
    },
    {
      id: "shielded",
      address: receive.shielded.address,
      // The verify-address intent compares a `getAddress` address, not a shielded derivation.
      verification: "unavailable",
      memoType: receive.shielded.memo?.type,
    },
  ];
  return { ...traits, verification, memoType, activationKind, addressOptions };
}
