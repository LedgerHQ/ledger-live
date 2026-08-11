export type SetupAction =
  | { type: "anvil_setBalance"; address: string; wei: string }
  | { type: "anvil_impersonate"; address: string }
  | { type: "anvil_stopImpersonate"; address: string }
  | { type: "send_and_mine"; tx: string }
  | { type: "mine_blocks"; count: number };

export type SendPerfFixture = {
  id: string;
  chain: "ethereum" | "solana" | "bitcoin";
  layer: 1 | 2 | 3;
  description: string;
  setup?: { actions: SetupAction[] };
  signedTx?: string;
  expectReject: string;
  expectErrorClass?: string;
  productionWeight?: {
    source: string;
    count_14d?: number;
    note?: string;
  };
};

export type BroadcastAttemptResult = {
  accepted: boolean;
  errorMessage?: string;
  errorName?: string;
};

export function assertRejection(
  fixtureId: string,
  result: BroadcastAttemptResult,
  expectReject: string,
  expectErrorClass?: string,
  alternates: string[] = [],
): void {
  if (result.accepted) {
    throw new Error(`${fixtureId}: expected rejection containing "${expectReject}" but tx was accepted`);
  }

  const message = result.errorMessage ?? "";
  const errorName = result.errorName ?? "";

  if (expectErrorClass && errorName === expectErrorClass) {
    return;
  }

  const needles = [expectReject, ...alternates].map(s => s.toLowerCase());
  const haystack = `${message} ${errorName}`.toLowerCase();
  if (!needles.some(needle => haystack.includes(needle))) {
    throw new Error(
      `${fixtureId}: expected rejection containing "${expectReject}", got: ${message || errorName || "(empty)"}`,
    );
  }

  if (expectErrorClass && errorName !== expectErrorClass) {
    throw new Error(
      `${fixtureId}: expected error class "${expectErrorClass}", got "${errorName || "unknown"}" (${message})`,
    );
  }
}
