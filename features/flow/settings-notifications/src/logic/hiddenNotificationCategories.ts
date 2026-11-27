import type { NotificationsCategoryConfig } from "../types";

/** The categories the remote config does not display, read as the legacy screen reads them. */
export function getHiddenNotificationCategories(
  configs: readonly NotificationsCategoryConfig[] | null | undefined,
): string[] {
  return (configs ?? []).filter(config => !config?.displayed).map(config => config?.category || "");
}
