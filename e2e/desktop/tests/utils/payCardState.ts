import { CARD_SESSION_BOOTSTRAP_ENV, DEFAULT_BAANX_BASE_URL } from "@ledgerhq/baanx-test-client";

export async function unfreezeCard(sessionJson?: string): Promise<void> {
  const raw = (sessionJson ?? process.env[CARD_SESSION_BOOTSTRAP_ENV])?.trim();
  const clientKey = process.env.BAANX_TEST_CLIENT_KEY?.trim();
  if (!raw) throw new Error(`${CARD_SESSION_BOOTSTRAP_ENV} is not set`);
  if (!clientKey) throw new Error("BAANX_TEST_CLIENT_KEY is not set");

  const { accessToken } = JSON.parse(raw);
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error(`${CARD_SESSION_BOOTSTRAP_ENV} has no accessToken`);
  }

  const baseUrl = (process.env.BAANX_TEST_API_URL?.trim() || DEFAULT_BAANX_BASE_URL).replace(
    /\/$/,
    "",
  );
  const response = await fetch(`${baseUrl}/v1/card/unfreeze`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "x-client-key": clientKey,
    },
  });
  if (!response.ok && response.status !== 400) {
    throw new Error(`Could not unfreeze the card (HTTP ${response.status})`);
  }
}
