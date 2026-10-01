import type { SwapStatus } from "@ledgerhq/live-common/exchange/swap/types";
import { colors } from "../../shared/ui";

export type SwapStatusValue = "PENDING" | "FINISHED" | "REFUNDED";

export type SwapStatusLine = {
  swapId: string;
  status: SwapStatusValue;
};

function normalizeStatus(rawStatus?: string): SwapStatusValue | undefined {
  const status = (rawStatus ?? "").trim().toUpperCase();
  switch (status) {
    case "FINISHED":
      return "FINISHED";
    case "REFUNDED":
    case "EXPIRED":
      return "REFUNDED";
    case "PENDING":
    case "ONHOLD":
      return "PENDING";
    default:
      return undefined;
  }
}

function matchingProvidersHint(matchingProviders: string[]): string {
  const [onlyMatch, ...otherMatches] = matchingProviders;
  if (onlyMatch === undefined) return "";
  if (otherMatches.length === 0) {
    return ` This swap belongs to provider "${onlyMatch}"; re-run with --provider ${onlyMatch}.`;
  }
  const quoted = matchingProviders.map(p => `"${p}"`).join(", ");
  return ` Multiple providers report a status for this swap id: ${quoted}. Check which provider was used to create your swap, then re-run with that --provider.`;
}

export class SwapNotFoundForProviderError extends Error {
  override name = "SwapNotFoundForProviderError";

  constructor(swapId: string, provider: string, matchingProviders: string[]) {
    super(
      `Swap "${swapId}" was not found for provider "${provider}". Check that --provider matches the provider used by swap execute.${matchingProvidersHint(matchingProviders)}`,
    );
  }
}

export function isSwapKnownToProvider(raw: SwapStatus): boolean {
  return normalizeStatus(raw.status) !== undefined;
}

export function mapSwapStatusLine(
  raw: SwapStatus,
  fallbackSwapId: string,
): SwapStatusLine | undefined {
  const swapId =
    (typeof raw.swapId === "string" && raw.swapId.trim() !== "" ? raw.swapId : fallbackSwapId) ??
    fallbackSwapId;
  const status = normalizeStatus(raw.status);
  if (status === undefined) return undefined;

  return { swapId, status };
}

export function statusIndicator(status: SwapStatusValue): string {
  switch (status) {
    case "PENDING":
      return "[⧖]";
    case "FINISHED":
      return "[✔]";
    case "REFUNDED":
      return "[↩]";
  }
}

export function formatSwapStatusHuman(status: SwapStatusLine): string {
  return `${statusIndicator(status.status)} ${colors.bold(status.status)} ${colors.dim(status.swapId)}`;
}
