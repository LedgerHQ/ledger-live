import { readCardUsEnv } from "@features/platform-card";
import type { CardAssetPathBuilder } from "./hostedPaths";
import type { OpenCardHostedPage } from "./types";

export type OpenHostedPageResult = { ok: true } | { ok: false; error: unknown };

/** Best effort on purpose: a hosted page that fails to open must never throw into the caller. */
export async function openHostedPageSafely(
  openHostedPage: OpenCardHostedPage,
  path: string,
): Promise<OpenHostedPageResult> {
  try {
    await openHostedPage(path);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function openHostedCardPathSafely(
  openHostedPage: OpenCardHostedPage,
  usAppId: string,
  buildPath: CardAssetPathBuilder,
  currency?: string,
): Promise<OpenHostedPageResult> {
  const isUsCardHolder = await readCardUsEnv(usAppId);

  return openHostedPageSafely(openHostedPage, buildPath(isUsCardHolder ? usAppId : null, currency));
}
