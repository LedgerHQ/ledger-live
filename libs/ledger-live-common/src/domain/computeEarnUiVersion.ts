import { EarnUiVersion, normalizeEarnUiVersionOrNull } from "./earnUiVersion";

const DEFAULT: EarnUiVersion = "v2";

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

  return normalizeEarnUiVersionOrNull(baseUiVersion) ?? DEFAULT;
}
