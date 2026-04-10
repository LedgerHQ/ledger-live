import BigNumber from "bignumber.js";
import type { Operation, SwapOperation, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById, setSupportedCurrencies } from "../../currencies";
import { setupMockCryptoAssetsStore } from "../../test-helpers/cryptoAssetsStore";
import { genAccount } from "../../mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import getCompleteSwapHistory from "./getCompleteSwapHistory";

setupMockCryptoAssetsStore();
setSupportedCurrencies(["ethereum", "bitcoin"]);

const ethereum = getCryptoCurrencyById("ethereum");

const makeTokenCurrency = (id: string): TokenCurrency => ({
  type: "TokenCurrency",
  id,
  name: "Mock Token",
  ticker: "MTK",
  contractAddress: "0x0000000000000000000000000000000000000001",
  parentCurrency: ethereum,
  tokenType: "erc20",
  units: [{ name: "MTK", code: "MTK", magnitude: 18 }],
});

const makeSwapOperation = (
  receiverAccountId: string,
  operation: Operation,
  tokenId?: string,
): SwapOperation => ({
  provider: "changelly",
  swapId: "swap-id-1",
  receiverAccountId,
  operationId: operation.id,
  fromAmount: new BigNumber(1),
  toAmount: new BigNumber(1),
  status: "completed",
  tokenId,
});

describe("getCompleteSwapHistory", () => {
  it("returns valid swaps and keeps resolved sender parent account", async () => {
    const senderParent = genAccount("sender-parent", { operationsSize: 1, currency: ethereum });
    const senderToken = genTokenAccount(0, senderParent, makeTokenCurrency("mock:token:sender"));
    const receiverAccount = genAccount("receiver-account-valid", { operationsSize: 0 });
    const operation = senderToken.operations[0];

    const senderTokenWithSwapHistory: TokenAccount = {
      ...senderToken,
      operations: [operation],
      pendingOperations: [],
      swapHistory: [makeSwapOperation(receiverAccount.id, operation)],
    };

    const result = await getCompleteSwapHistory([
      senderTokenWithSwapHistory,
      senderParent,
      receiverAccount,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].data).toHaveLength(1);
    expect(result[0].data[0].fromParentAccount?.id).toBe(senderParent.id);
    expect(result[0].data[0].toAccount.id).toBe(receiverAccount.id);
  });
});
