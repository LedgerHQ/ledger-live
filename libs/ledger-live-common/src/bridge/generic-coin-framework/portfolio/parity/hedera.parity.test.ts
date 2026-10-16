import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { callsOf } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  configure,
  emptyAccount,
  freezeTime,
  normaliseAccount,
  runSyncScenario,
  scanAccounts,
  serveChain,
  syncAccount,
  token,
  useTokens,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));

const hedera = getCryptoCurrencyById("hedera");
const ME = "0.0.1234";
const OTHER = "0.0.999";
const SEED_PUBLIC_KEY = "public-key-44/3030";
const HTS = token({
  id: "hedera/hts/0.0.456",
  parentCurrencyId: "hedera",
  contractAddress: "0.0.456",
  tokenType: "hts",
});
const hts = { type: "hts", assetReference: HTS.contractAddress, assetOwner: ME };
const native = { type: "native" } as const;

const balances: Balance[] = [
  {
    value: 10_000n,
    asset: native,
    stake: {
      uid: ME,
      address: ME,
      delegate: "0.0.3",
      state: "active",
      actions: ["undelegate", "redelegate"],
      asset: native,
      amount: 10_000n,
      amountRewarded: 5n,
    },
  },
  { value: 10n, asset: hts },
];

const operations = [
  coinOperation({
    height: 13,
    type: "OUT",
    value: 10n,
    fees: 100n,
    feesPayer: ME,
    senders: [ME],
    recipients: [OTHER],
    details: { memo: "rent" },
  }),
  // A token transfer the account paid the fee of, with no native operation: a FEES operation.
  coinOperation({
    height: 12,
    type: "OUT",
    value: 5n,
    fees: 100n,
    asset: hts,
    feesPayer: ME,
    senders: [ME],
    recipients: [OTHER],
    details: { ledgerOpType: "OUT", assetAmount: "5" },
  }),
  coinOperation({
    height: 11,
    value: 3n,
    fees: 100n,
    asset: hts,
    feesPayer: OTHER,
    senders: [OTHER],
    recipients: [ME],
    details: { ledgerOpType: "IN", assetAmount: "3" },
  }),
  coinOperation({
    height: 10,
    value: 500n,
    fees: 100n,
    feesPayer: OTHER,
    senders: [OTHER],
    recipients: [ME],
  }),
];

const accountInfo = {
  type: "hedera",
  stakedNodeId: 3,
  balance: "10000",
  pendingReward: "5",
  maxAutomaticTokenAssociations: -1,
};

const chain = {
  tip: blockAt(14),
  balances,
  operations,
  validators: [{ id: "3", address: "0.0.3", name: "Node 3" }],
  accountInfo,
  addressesForPublicKey: (publicKey: string) => (publicKey === SEED_PUBLIC_KEY ? [ME] : []),
};

const account = () =>
  emptyAccount(hedera, ME, { derivationMode: "hederaBip44", seedIdentifier: SEED_PUBLIC_KEY });

beforeAll(() => {
  freezeTime();
  useTokens([HTS]);
});

afterAll(() => jest.useRealTimers());

afterEach(() => jest.restoreAllMocks());

describe("Hedera parity", () => {
  it("syncs the same account on both paths: family fields, FEES operations, stake, sync version", async () => {
    const [first, second] = await runSyncScenario({
      currency: hedera,
      family: "hedera",
      account: account(),
      chain,
      next: {
        ...chain,
        tip: blockAt(30),
        operations: [
          coinOperation({
            height: 20,
            hash: "hedera-pending",
            type: "OUT",
            value: 1n,
            fees: 100n,
            feesPayer: ME,
            senders: [ME],
            recipients: [OTHER],
          }),
          ...operations,
        ],
        accountInfo: { ...accountInfo, stakedNodeId: -1 },
      },
      pendingHash: "hedera-pending",
    });
    expect(first.legacy.syncHash).toMatch(/-1$/);
    expect(first.legacy.operations.map(({ type }) => type)).toEqual(["OUT", "FEES", "NONE", "IN"]);
    expect(first.legacy).toMatchObject({ hederaResources: { delegation: { nodeId: 3 } } });
    expect(second.legacy).toMatchObject({ hederaResources: { delegation: null } });
  });

  it("fails the sync on both paths when the family's account read fails", async () => {
    const failing = { ...chain, accountInfoError: new Error("mirror node down") };
    configure(hedera, "legacy");
    serveChain(failing);
    const legacy = await syncAccount("hedera", account()).catch((error: Error) => error);
    configure(hedera, "local");
    serveChain(failing);
    const portfolio = await syncAccount("hedera", account()).catch((error: Error) => error);

    expect(legacy).toBeInstanceOf(Error);
    expect(portfolio).toBeInstanceOf(legacy.constructor);
    expect({ name: (portfolio as Error).name, message: (portfolio as Error).message }).toEqual({
      name: (legacy as Error).name,
      message: (legacy as Error).message,
    });
  });

  it("scans the accounts the device key controls through the address lookup, on both paths", async () => {
    configure(hedera, "legacy");
    const legacyModule = serveChain(chain);
    const legacy = await scanAccounts("hedera", hedera);
    configure(hedera, "local");
    const portfolioModule = serveChain(chain);
    const portfolio = await scanAccounts("hedera", hedera);

    expect(legacy.map(({ freshAddress }) => freshAddress)).toEqual([ME]);
    expect(portfolio.map(normaliseAccount)).toEqual(legacy.map(normaliseAccount));
    expect(callsOf(portfolioModule.getAddressesForPublicKey as jest.Mock)).toEqual(
      callsOf(legacyModule.getAddressesForPublicKey as jest.Mock),
    );
  });
});
