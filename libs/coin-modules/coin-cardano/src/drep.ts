import { types as TyphonTypes } from "@stricahq/typhonjs";
import bech32 from "bech32";
import { CardanoInvalidDRepId } from "./errors";

const DREP_KEY_HEADER = 0x22;
const DREP_SCRIPT_HEADER = 0x23;
const DREP_CREDENTIAL_LENGTH = 28;

type DRepCredentialType = "key" | "script";

export type DRep = {
  readonly type: DRepCredentialType;
  readonly hash: Buffer;
};

export type VoteDelegationTarget =
  | { readonly type: "drep"; readonly drepId: string }
  | { readonly type: "alwaysAbstain" }
  | { readonly type: "alwaysNoConfidence" };

/** Parses the CIP-129 DRep identifier; CIP-105 identifiers have no credential header and are rejected. */
export function parseDRepId(drepId: string): DRep {
  try {
    const { prefix, words } = bech32.decode(drepId, 1023);
    if (prefix !== "drep") throw new Error("Unexpected DRep prefix");

    const bytes = Buffer.from(bech32.fromWords(words));
    if (bytes.length !== DREP_CREDENTIAL_LENGTH + 1) throw new Error("Unexpected DRep length");

    const type =
      bytes[0] === DREP_KEY_HEADER ? "key" : bytes[0] === DREP_SCRIPT_HEADER ? "script" : undefined;
    if (!type) throw new Error("Unexpected DRep credential");

    return { type, hash: bytes.subarray(1) };
  } catch {
    throw new CardanoInvalidDRepId();
  }
}

export function formatDRepId({ type, hash }: DRep): string {
  if (hash.length !== DREP_CREDENTIAL_LENGTH) throw new CardanoInvalidDRepId();

  const header = type === "key" ? DREP_KEY_HEADER : DREP_SCRIPT_HEADER;
  return bech32.encode("drep", bech32.toWords(Buffer.concat([Buffer.from([header]), hash])), 1023);
}

export function toTyphonDRep(target: VoteDelegationTarget): TyphonTypes.DRep {
  switch (target.type) {
    case "drep": {
      const drep = parseDRepId(target.drepId);
      return {
        type: drep.type === "key" ? TyphonTypes.DRepType.ADDRESS : TyphonTypes.DRepType.SCRIPT,
        key: drep.hash,
      };
    }
    case "alwaysAbstain":
      return { type: TyphonTypes.DRepType.ABSTAIN, key: undefined };
    case "alwaysNoConfidence":
      return { type: TyphonTypes.DRepType.NO_CONFIDENCE, key: undefined };
  }
}
