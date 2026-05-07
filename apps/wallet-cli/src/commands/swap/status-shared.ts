import type { SwapStatus } from "@ledgerhq/live-common/exchange/swap/types";
import { colors } from "../../shared/ui";

export type SwapStatusValue = "PENDING" | "FINISHED" | "REFUNDED" | "UNKNOWN";

export type SwapStatusLine = {
  swapId: string;
  status: SwapStatusValue;
};

function normalizeStatus(rawStatus?: string): SwapStatusValue {
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
      return "UNKNOWN";
  }
}

export function mapSwapStatusLine(raw: SwapStatus, fallbackSwapId: string): SwapStatusLine {
  const swapId =
    (typeof raw.swapId === "string" && raw.swapId.trim() !== "" ? raw.swapId : fallbackSwapId) ??
    fallbackSwapId;
  const status = normalizeStatus(raw.status);

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
    case "UNKNOWN":
      return "[?]";
  }
}

export function formatSwapStatusHuman(status: SwapStatusLine): string {
  return `${statusIndicator(status.status)} ${colors.bold(status.status)} ${colors.dim(status.swapId)}`;
}
