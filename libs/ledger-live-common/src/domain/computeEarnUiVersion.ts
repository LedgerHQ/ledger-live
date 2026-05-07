import { z } from "zod";

type EarnUiVersion = `v${number}`;

const DEFAULT: EarnUiVersion = "v2";

const coercedString = z.coerce.string();

function parseEarnUiVersionOrNull(raw: string): EarnUiVersion | null {
  const bare = raw.startsWith("v") ? raw.slice(1) : raw;
  const n = z.coerce.number().int().positive().safeParse(bare);
  return n.success ? `v${n.data}` : null;
}

export type ComputeEarnUiVersionInput = {
  baseUiVersion: string | number | null | undefined;
  shouldDisplayEarnUpselling?: boolean;
  shouldDisplayEarnSimulator?: boolean;
};

/**
 * Computes the final Earn UI version from Wallet40 toggles and ptxEarnUi value.
 * Precedence: simulator (v4) > upselling (v3) > baseUiVersion (normalized, fallback to v2).
 */
export function computeEarnUiVersion({
  baseUiVersion,
  shouldDisplayEarnUpselling = false,
  shouldDisplayEarnSimulator = false,
}: ComputeEarnUiVersionInput): EarnUiVersion {
  if (shouldDisplayEarnSimulator) return "v4";
  if (shouldDisplayEarnUpselling) return "v3";

  const baseRaw = baseUiVersion == null ? DEFAULT : coercedString.parse(baseUiVersion);
  return parseEarnUiVersionOrNull(baseRaw) ?? DEFAULT;
}
