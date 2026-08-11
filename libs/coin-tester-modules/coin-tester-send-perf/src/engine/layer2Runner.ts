import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { broadcast } from "@ledgerhq/coin-evm/logic/broadcast";
import { setCoinConfig } from "@ledgerhq/coin-evm/config";
import { InsufficientFunds } from "@ledgerhq/coin-evm/errors";
import { assertRejection, BroadcastAttemptResult } from "./fixtureTypes";
import { ANVIL_RPC } from "./layer1Runner";

export { InsufficientFunds };

export function configureAnvilCoinEvm(): void {
  setCoinConfig(() => ({
    info: {
      status: { type: "active" },
      gasTracker: { type: "ledger", explorerId: "eth" },
      node: { type: "external", uri: ANVIL_RPC },
      explorer: { type: "ledger", explorerId: "eth" },
      showNfts: false,
    },
  }));
}

export async function broadcastViaCoinEvm(signedTxHex: string): Promise<BroadcastAttemptResult> {
  const currency = getCryptoCurrencyById("ethereum");

  return broadcast(currency, { signature: signedTxHex })
    .then(hash => ({ accepted: true as const, errorMessage: hash }))
    .catch((err: unknown) => {
      const error = err as Error;
      return {
        accepted: false as const,
        errorMessage: error.message ?? String(err),
        errorName: error.name,
      };
    });
}

export async function runLayer2Fixture(
  fixtureId: string,
  signedTx: string,
  expectReject: string,
  expectErrorClass?: string,
): Promise<void> {
  configureAnvilCoinEvm();
  const result = await broadcastViaCoinEvm(signedTx);
  const alternates =
    fixtureId === "eth-nonce-too-low-after-mined" ? ["nonce has already been used"] : [];
  assertRejection(fixtureId, result, expectReject, expectErrorClass, alternates);
}
