import BigNumber from "bignumber.js";
import type { Account, Operation, SwapOperation, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "../../currencies";
import { setupMockCryptoAssetsStore } from "../../test-helpers/cryptoAssetsStore";
import { genAccount } from "../../mock/account";
import { genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import getCompleteSwapHistory from "./getCompleteSwapHistory";

setupMockCryptoAssetsStore();

const ethereum = getCryptoCurrencyById("ethereum");

const makeTokenCurrency = (id: string): TokenCurrency => ({
  type: "TokenCurrency",
  id,
  name: "Mock Token",
  ticker: "MTK",
  contractAddress: "0x0000000000000000000000000000000000000001",
  parentCurrencyId: "ethereum",
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

const makeOperation = (
  overrides: Pick<Operation, "id" | "hash" | "type" | "value" | "accountId"> & Partial<Operation>,
): Operation => ({
  fee: new BigNumber(0),
  senders: [],
  recipients: [],
  blockHeight: 1,
  blockHash: "0xblock",
  date: new Date("2026-01-02T03:04:05.000Z"),
  extra: {},
  ...overrides,
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

  it("derives finalAmount for a finished DEX swap from the receiving token account IN operation", async () => {
    const txHash = "0xdextokenhash";
    const senderParent = genAccount("dex-token-sender", { operationsSize: 0, currency: ethereum });
    const receiverParent = genAccount("dex-token-receiver", {
      operationsSize: 0,
      currency: ethereum,
    });
    const receiverToken = genTokenAccount(
      0,
      receiverParent,
      makeTokenCurrency("mock:token:dex-receiver"),
    );

    const sender: Account = {
      ...senderParent,
      operations: [
        makeOperation({
          id: `${senderParent.id}-${txHash}-OUT`,
          hash: txHash,
          type: "OUT",
          value: new BigNumber(1),
          accountId: senderParent.id,
        }),
      ],
      pendingOperations: [],
      swapHistory: [
        {
          provider: "uniswap",
          swapId: "dex-swap-1",
          receiverAccountId: receiverToken.id,
          operationId: `dex-swap-1-${txHash}-OUT`,
          fromAmount: new BigNumber(1),
          toAmount: new BigNumber("200000"),
          status: "finished",
        },
      ],
    };
    const receiver: TokenAccount = {
      ...receiverToken,
      operations: [
        makeOperation({
          id: `${receiverToken.id}-${txHash}-IN`,
          hash: txHash,
          type: "IN",
          value: new BigNumber("250000"),
          accountId: receiverToken.id,
        }),
      ],
      pendingOperations: [],
    };

    const result = await getCompleteSwapHistory([sender, receiverParent, receiver]);

    expect(result[0].data[0].finalAmount?.toString()).toBe("250000");
  });

  it("derives finalAmount for a finished DEX swap from a native receive internal operation", async () => {
    const txHash = "0xdexnativehash";
    const senderParent = genAccount("dex-native-sender", { operationsSize: 0, currency: ethereum });
    const receiver = genAccount("dex-native-receiver", { operationsSize: 0, currency: ethereum });

    const receiverWithReceive: Account = {
      ...receiver,
      operations: [
        makeOperation({
          id: `${receiver.id}-${txHash}-OUT`,
          hash: txHash,
          type: "OUT",
          value: new BigNumber("21000"),
          accountId: receiver.id,
          internalOperations: [
            makeOperation({
              id: `${receiver.id}-${txHash}-i0-IN`,
              hash: txHash,
              type: "IN",
              value: new BigNumber("500000"),
              accountId: receiver.id,
            }),
          ],
        }),
      ],
      pendingOperations: [],
    };
    const sender: Account = {
      ...senderParent,
      operations: [
        makeOperation({
          id: `${senderParent.id}-${txHash}-OUT`,
          hash: txHash,
          type: "OUT",
          value: new BigNumber(1),
          accountId: senderParent.id,
        }),
      ],
      pendingOperations: [],
      swapHistory: [
        {
          provider: "uniswap",
          swapId: "dex-native-1",
          receiverAccountId: receiver.id,
          operationId: `dex-native-1-${txHash}-OUT`,
          fromAmount: new BigNumber(1),
          toAmount: new BigNumber("400000"),
          status: "finished",
        },
      ],
    };

    const result = await getCompleteSwapHistory([sender, receiverWithReceive]);

    expect(result[0].data[0].finalAmount?.toString()).toBe("500000");
  });

  it("leaves finalAmount undefined for a DEX swap when the receive operation has not synced yet", async () => {
    const txHash = "0xdexpendinghash";
    const senderParent = genAccount("dex-missing-sender", {
      operationsSize: 0,
      currency: ethereum,
    });
    const receiverParent = genAccount("dex-missing-receiver", {
      operationsSize: 0,
      currency: ethereum,
    });
    const receiverToken = genTokenAccount(
      0,
      receiverParent,
      makeTokenCurrency("mock:token:dex-missing"),
    );

    const sender: Account = {
      ...senderParent,
      operations: [
        makeOperation({
          id: `${senderParent.id}-${txHash}-OUT`,
          hash: txHash,
          type: "OUT",
          value: new BigNumber(1),
          accountId: senderParent.id,
        }),
      ],
      pendingOperations: [],
      swapHistory: [
        {
          provider: "uniswap",
          swapId: "dex-missing-1",
          receiverAccountId: receiverToken.id,
          operationId: `dex-missing-1-${txHash}-OUT`,
          fromAmount: new BigNumber(1),
          toAmount: new BigNumber("200000"),
          status: "finished",
        },
      ],
    };
    const receiver: TokenAccount = {
      ...receiverToken,
      operations: [],
      pendingOperations: [],
    };

    const result = await getCompleteSwapHistory([sender, receiverParent, receiver]);

    expect(result[0].data[0].finalAmount).toBeUndefined();
  });

  it("keeps the persisted (CEX) finalAmount and converts it to atomic units", async () => {
    const txHash = "0xcexhash";
    const senderParent = genAccount("cex-sender", { operationsSize: 0, currency: ethereum });
    const receiverParent = genAccount("cex-receiver", { operationsSize: 0, currency: ethereum });
    const receiverToken = genTokenAccount(0, receiverParent, makeTokenCurrency("mock:token:cex"));

    const sender: Account = {
      ...senderParent,
      operations: [
        makeOperation({
          id: "cex-operation-id",
          hash: txHash,
          type: "OUT",
          value: new BigNumber(1),
          accountId: senderParent.id,
        }),
      ],
      pendingOperations: [],
      swapHistory: [
        {
          provider: "changelly",
          swapId: "cex-swap",
          receiverAccountId: receiverToken.id,
          operationId: "cex-operation-id",
          fromAmount: new BigNumber(1),
          toAmount: new BigNumber("200000"),
          finalAmount: new BigNumber("0.003"),
          status: "finished",
        },
      ],
    };
    const receiver: TokenAccount = {
      ...receiverToken,
      operations: [],
      pendingOperations: [],
    };

    const result = await getCompleteSwapHistory([sender, receiverParent, receiver]);

    expect(result[0].data[0].finalAmount?.toString()).toBe("3000000000000000");
  });
});
