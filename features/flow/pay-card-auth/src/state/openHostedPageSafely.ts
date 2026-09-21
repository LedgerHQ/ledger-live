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
