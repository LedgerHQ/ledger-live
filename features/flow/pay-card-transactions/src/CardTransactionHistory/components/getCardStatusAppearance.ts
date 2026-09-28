import type { PayCardTransaction } from "@domain/api-card-management";

export function getCardStatusAppearance(
  status: PayCardTransaction["status"],
): "error" | "muted" | undefined {
  if (status === "DECLINED") return "error";
  if (status === "REVERTED") return "muted";
  return undefined;
}
