import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Address } from "@ledgerhq/wallet-btc/storage/types";
import { firstValueFrom } from "rxjs";
import { bitcoinDefaults, type BitcoinContext } from "../../config";
import { createFixtureAccount, mockSignerContext } from "../../fixtures/common.fixtures";
import { fromBitcoinResourcesRaw, toBitcoinResourcesRaw } from "../../serialization";
import { makeGetAccountShape } from "../../synchronisation";
import type { BitcoinAccount } from "../../types";
import { TEST_LOGGER } from "../fixtures/coinConfig";

const TPUB =
  "tpubDCYcGoj35gRcahvoxni1TTEaSgbqWXtqG6HvFWoXbXC2fbw2mprWwyKzvgv4WY4pBs8SL9wZzQYZ8bX9ecKQ91C5eTnsGuVEBKnborrKhUH";

const FUNDING_BY_EXPLORER: Record<string, { txId: string; value: string }> = {
  btc_signet: { txId: "51".repeat(32), value: "1500" },
  btc_testnet: { txId: "7e".repeat(32), value: "990000" },
};

jest.mock("@ledgerhq/wallet-btc/explorer/index", () => {
  const Actual = jest.requireActual("@ledgerhq/wallet-btc/explorer/index").default;
  const block = { height: 100, hash: "00".repeat(32), time: "2026-01-01T00:00:00Z" };
  return {
    __esModule: true,
    default: class FakeExplorerPerRoute extends Actual {
      getCurrentBlock = jest.fn().mockResolvedValue(block);
      getBlockByHeight = jest.fn().mockResolvedValue(block);
      fetchPendingTxs = jest.fn().mockResolvedValue([]);
      fetchTxs = jest.fn(async (address: Address, params: { from_height?: number }) => {
        const explorerId = (this.baseUrl as string).split("/").pop()!;
        const funding = FUNDING_BY_EXPLORER[explorerId];
        const isFirstReceiveAddress = address.account === 0 && address.index === 0;
        if (!funding || !isFirstReceiveAddress || (params.from_height ?? 0) > block.height) {
          return { txs: [], nextPageToken: null };
        }
        return {
          nextPageToken: null,
          txs: [
            {
              id: funding.txId,
              hash: funding.txId,
              received_at: block.time,
              block,
              fees: 100,
              inputs: [
                {
                  value: String(Number(funding.value) + 100),
                  address: "tb1qexternalsender",
                  output_hash: "ee".repeat(32),
                  output_index: 0,
                  sequence: 0xffffffff,
                },
              ],
              outputs: [
                {
                  value: funding.value,
                  address: address.address,
                  output_hash: funding.txId,
                  output_index: 0,
                  block_height: block.height,
                  rbf: false,
                },
              ],
            },
          ],
        };
      });
    },
  };
});

const liveRoutesContext: BitcoinContext = {
  config: async currencyId => bitcoinDefaults[currencyId as keyof typeof bitcoinDefaults],
  logger: TEST_LOGGER,
};

const accountIdFor = (currencyId: string) => `js:2:${currencyId}:${TPUB}:native_segwit`;

async function syncAccount(currencyId: string, initialAccount?: BitcoinAccount) {
  const getAccountShape = makeGetAccountShape(mockSignerContext, liveRoutesContext);
  return firstValueFrom(
    getAccountShape(
      {
        currency: getCryptoCurrencyById(currencyId),
        address: "",
        index: 0,
        derivationPath: "84'/1'",
        derivationMode: "native_segwit",
        initialAccount: initialAccount ?? {
          ...createFixtureAccount(),
          id: accountIdFor(currencyId),
          currency: getCryptoCurrencyById(currencyId),
        },
      },
      { paginationConfig: {} },
    ),
  );
}

function restore(currencyId: string, shape: Partial<BitcoinAccount>): BitcoinAccount {
  const raw = toBitcoinResourcesRaw(shape.bitcoinResources!);
  return {
    ...createFixtureAccount(),
    ...shape,
    id: accountIdFor(currencyId),
    currency: getCryptoCurrencyById(currencyId),
    bitcoinResources: fromBitcoinResourcesRaw(TEST_LOGGER, raw),
  };
}

function syncedState(shape: Partial<BitcoinAccount>) {
  return {
    balance: shape.balance?.toString(),
    utxos: shape.bitcoinResources?.utxos.map(u => [u.hash, u.value.toString()]),
    explorerUrl: shape.bitcoinResources?.walletAccount?.xpub.explorer.baseUrl,
  };
}

function fundedBy(explorerId: string) {
  const { txId, value } = FUNDING_BY_EXPLORER[explorerId];
  return {
    balance: value,
    utxos: [[txId, value]],
    explorerUrl: `https://explorers.api.live.ledger.com/blockchain/v4/${explorerId}`,
  };
}

describe("bitcoin_signet synchronisation isolation from testnet3", () => {
  it("scans the same xpub against each network's own explorer route", async () => {
    const [signet, testnet] = await Promise.all([
      syncAccount("bitcoin_signet"),
      syncAccount("bitcoin_testnet"),
    ]);

    expect(syncedState(signet)).toEqual(fundedBy("btc_signet"));
    expect(syncedState(testnet)).toEqual(fundedBy("btc_testnet"));
  });

  it("keeps each network's explorer after the accounts are deserialized", async () => {
    const [signet, testnet] = await Promise.all([
      syncAccount("bitcoin_signet"),
      syncAccount("bitcoin_testnet"),
    ]);
    const restoredTestnet = restore("bitcoin_testnet", testnet);
    const restoredSignet = restore("bitcoin_signet", signet);

    const [resyncedSignet, resyncedTestnet] = await Promise.all([
      syncAccount("bitcoin_signet", restoredSignet),
      syncAccount("bitcoin_testnet", restoredTestnet),
    ]);

    expect(syncedState(resyncedSignet)).toEqual(fundedBy("btc_signet"));
    expect(syncedState(resyncedTestnet)).toEqual(fundedBy("btc_testnet"));
  });
});
