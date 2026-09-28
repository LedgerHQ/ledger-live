import { readCardUsEnv } from "@features/platform-card";
import type { CardAssetPathBuilder } from "./hostedPaths";
import type { OpenCardHostedPage } from "./types";

/** Best effort on purpose: a hosted page that fails to open must never throw into the caller. */
export async function openHostedPageSafely(
  openHostedPage: OpenCardHostedPage,
  path: string,
  onError: (error: unknown) => void,
): Promise<void> {
  try {
    await openHostedPage(path);
  } catch (error) {
    onError(error);
  }
}

export async function openHostedCardPathSafely(
  openHostedPage: OpenCardHostedPage,
  usAppId: string,
  buildPath: CardAssetPathBuilder,
  onError: (error: unknown) => void,
  currency?: string,
): Promise<void> {
  const isUsCardHolder = await readCardUsEnv(usAppId);

  await openHostedPageSafely(
    openHostedPage,
    buildPath(isUsCardHolder ? usAppId : null, currency),
    onError,
  );
}
