interface TgBotCallbackParams {
  tgBotSession: string;
  tgBotCallback: string;
  status: string;
  swapId?: string;
  txHash?: string;
  provider?: string;
}

export function tgBotCallback() {
  return async ({ params }: { params: TgBotCallbackParams }) => {
    const { tgBotCallback: callbackUrl, tgBotSession, status, swapId, txHash, provider } = params;

    if (!callbackUrl || !tgBotSession) {
      return;
    }

    try {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tgBotSession,
          status,
          swapId,
          txHash,
          provider,
          // In production, compute HMAC signature here
          signature: "dev-signature",
        }),
      });
    } catch (err) {
      console.error("TgBot callback failed:", err);
    }
  };
}
