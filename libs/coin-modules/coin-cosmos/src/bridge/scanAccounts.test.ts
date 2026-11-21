import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { cosmosDefaultsFor } from "../test/cosmosDefaults";
import type { CosmosSigner } from "../types/signer";
import { validateAddress } from "../validateAddress";
import { createBridges } from "./index";

const mockGetAccountInfo = jest.fn();
jest.mock("../network/Cosmos", () => ({
  CosmosAPI: class {
    getAccountInfo = (address: string) => mockGetAccountInfo(address);
  },
}));

const accountInfo = (balance: number, sequence: number) => ({
  txs: [],
  delegations: [],
  redelegations: [],
  unbondings: [],
  blockHeight: 21000000,
  balances: new BigNumber(balance),
  accountInfo: { sequence, accountNumber: 0 },
});

const PUBLIC_KEYS = [
  "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a",
  "02b3c7368432b998240a2806eb08a00becd359867ca9cdc94f3eb4ba29a6eb0d7a",
  "03cd9e27aa78eddce3fda5f8050db35196b188d80d10bd04aab15e5669defee8b0",
];

type ChainFixture = {
  currencyId: string;
  hrp: string;
  coinType: number;
  unit: string;
};

const CHAINS: ChainFixture[] = [
  { currencyId: "cosmos", hrp: "cosmos", coinType: 118, unit: "uatom" },
  { currencyId: "osmo", hrp: "osmo", coinType: 118, unit: "uosmo" },
  { currencyId: "coreum", hrp: "core", coinType: 118, unit: "ucore" },
  { currencyId: "injective", hrp: "inj", coinType: 60, unit: "inj" },
  { currencyId: "mantra", hrp: "mantra", coinType: 118, unit: "uom" },
  { currencyId: "persistence", hrp: "persistence", coinType: 118, unit: "uxprt" },
  { currencyId: "crypto_org", hrp: "cro", coinType: 394, unit: "basecro" },
];

const accountPathIndex = (path: string): number => Number.parseInt(path.split("/")[2], 10);

const addressOf = (hrp: string, index: number): string => `${hrp}1account${index}`;

const buildSigner = (): CosmosSigner => ({
  getAddress: async (path, hrp) => ({
    address: addressOf(hrp, accountPathIndex(path)),
    publicKey: PUBLIC_KEYS[accountPathIndex(path)],
  }),
  getAddressAndPubKey: async () => {
    throw new Error("getAddressAndPubKey is not expected during a scan");
  },
  sign: async () => {
    throw new Error("sign is not expected during a scan");
  },
});

const signerContext: SignerContext<CosmosSigner> = (_deviceId, fn) => fn(buildSigner());

const mockUsedAccounts = (usedAddresses: string[]) => {
  mockGetAccountInfo.mockImplementation(async (address: string) =>
    accountInfo(usedAddresses.includes(address) ? 5_000_000 : 0, 0),
  );
};

const scan = async (currencyId: string): Promise<Account[]> => {
  const events = await lastValueFrom(
    createBridges(signerContext, cosmosDefaultsFor)
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById(currencyId),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );
  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account);
};

describe("cosmos currency bridge scanAccounts", () => {
  beforeEach(() => {
    mockGetAccountInfo.mockReset();
  });

  describe.each(CHAINS)("$currencyId", ({ currencyId, hrp, coinType }) => {
    it("derives the id, the paths and the keys of a used account", async () => {
      mockUsedAccounts([addressOf(hrp, 0)]);

      const [first] = await scan(currencyId);

      expect(first).toMatchObject({
        id: `js:2:${currencyId}:${addressOf(hrp, 0)}:`,
        xpub: PUBLIC_KEYS[0],
        seedIdentifier: PUBLIC_KEYS[0],
        freshAddress: addressOf(hrp, 0),
        freshAddressPath: `44'/${coinType}'/0'/0/0`,
        derivationMode: "",
        index: 0,
        used: true,
        balance: new BigNumber(5_000_000),
      });
    });

    it("keeps the seed key as the identifier of the following accounts", async () => {
      mockUsedAccounts([addressOf(hrp, 0), addressOf(hrp, 1)]);

      const accounts = await scan(currencyId);

      expect(accounts.slice(0, 2).map(a => [a.index, a.xpub, a.seedIdentifier])).toEqual([
        [0, PUBLIC_KEYS[0], PUBLIC_KEYS[0]],
        [1, PUBLIC_KEYS[1], PUBLIC_KEYS[0]],
      ]);
    });

    it("derives the path of the following accounts from the account index", async () => {
      mockUsedAccounts([addressOf(hrp, 0), addressOf(hrp, 1)]);

      const accounts = await scan(currencyId);

      expect(accounts.slice(0, 2).map(a => a.freshAddressPath)).toEqual([
        `44'/${coinType}'/0'/0/0`,
        `44'/${coinType}'/1'/0/0`,
      ]);
    });

    it("flags a funded account as used and an empty one as unused", async () => {
      mockUsedAccounts([addressOf(hrp, 0)]);

      const accounts = await scan(currencyId);

      expect(accounts.map(a => [a.index, a.used])).toEqual([
        [0, true],
        [1, false],
      ]);
    });

    it("estimates the fees against a valid address of the chain of the account", async () => {
      mockUsedAccounts([addressOf(hrp, 0)]);
      const [first] = await scan(currencyId);

      const recipient = createBridges(
        signerContext,
        cosmosDefaultsFor,
      ).accountBridge.getEstimationRecipient?.(first);

      await expect(validateAddress(recipient ?? "", { currencyId })).resolves.toBe(true);
    });

    it("discovers no sub account", async () => {
      mockUsedAccounts([addressOf(hrp, 0)]);

      const [first] = await scan(currencyId);

      expect(first.subAccounts).toBeUndefined();
    });
  });

  it("proposes a single empty account when the device account holds nothing", async () => {
    mockUsedAccounts([]);

    const accounts = await scan("cosmos");

    expect(accounts.map(a => [a.index, a.used])).toEqual([[0, false]]);
  });

  it("flags an account used when it only has a sequence and stops at the next empty account", async () => {
    mockGetAccountInfo.mockImplementation(async (address: string) =>
      accountInfo(0, address === addressOf("cosmos", 0) ? 3 : 0),
    );

    const accounts = await scan("cosmos");

    expect({
      accounts: accounts.map(a => [a.index, a.used]),
      accountInfoReads: mockGetAccountInfo.mock.calls.length,
    }).toEqual({
      accounts: [
        [0, true],
        [1, false],
      ],
      accountInfoReads: 2,
    });
  });
});
