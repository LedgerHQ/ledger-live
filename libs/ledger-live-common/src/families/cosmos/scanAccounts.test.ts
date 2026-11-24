import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import { liveConfig } from "../../config/sharedConfig";
import { getCurrencyBridge } from "../../bridge";
import { createTransaction } from "../../bridge/generic-coin-framework/createTransaction";
import { mockDeviceWithAPDUs, releaseMockDevice } from "../../__tests__/test-helpers/mockDevice";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./fixtures/deviceApdus";
import { scanRecordedDevice, scanRecordedDevicePrefix } from "./fixtures/recordedDeviceScan";

beforeAll(() => {
  LiveConfig.setConfig(liveConfig);
});

const mockUsedAddresses = new Set<string>();
const mockGetRedelegations = jest.fn();

jest.mock("@ledgerhq/coin-cosmos/network/Cosmos", () => ({
  CosmosAPI: class {
    getAllBalances = async (address: string) => ({
      toFixed: () => (mockUsedAddresses.has(address) ? "5000000" : "0"),
    });
    getAccount = async () => ({
      accountNumber: 0,
      sequence: 0,
      pubKeyType: "",
      pubKey: "",
    });
    getLatestBlockInfo = async () => ({ height: 21000000, hash: "hash", time: new Date(0) });
    getTransactionsPage = async () => ({ streams: [] });
    getStakingPositions = async () => ({ delegations: [], unbondings: [] });
    getRedelegationsWithQueued = (...args: unknown[]) => mockGetRedelegations(...args);
    getValidators = async () => [];
    getDelegations = async () => [];
    getUnbondings = async () => [];
  },
}));

const REDELEGATION = {
  validatorSrcAddress: "cosmosvaloper1src",
  validatorDstAddress: "cosmosvaloper1dst",
  amount: new BigNumber(250_000),
  completionDate: new Date("2026-12-01T00:00:00Z"),
};

beforeEach(() => {
  mockGetRedelegations.mockReset();
  mockGetRedelegations.mockResolvedValue([]);
});

const usedAccountsOf = (chain: DeviceChainFixture, count: number) => {
  mockUsedAddresses.clear();
  for (const account of chain.accounts.slice(0, count)) mockUsedAddresses.add(account.address);
};

describe.each(DEVICE_CHAINS)("cosmos generic scanAccounts of $currencyId", chain => {
  const [first, second] = chain.accounts;

  it("derives the id, the keys, the address and the path of the first account", async () => {
    usedAccountsOf(chain, 1);

    const [account] = await scanRecordedDevice(chain);

    expect(account).toMatchObject({
      id: `js:2:${chain.currencyId}:${first.address}:`,
      xpub: first.publicKey,
      seedIdentifier: first.publicKey,
      freshAddress: first.address,
      freshAddressPath: first.path,
      derivationMode: "",
      index: 0,
      used: true,
      balance: new BigNumber(5_000_000),
      subAccounts: [],
    });
  });

  it("carries the redelegations the chain reports in the staking resources", async () => {
    usedAccountsOf(chain, 1);
    mockGetRedelegations.mockResolvedValue([REDELEGATION]);

    const [account] = await scanRecordedDevice(chain);

    expect(account).toMatchObject({ stakingResources: { redelegations: [REDELEGATION] } });
  });

  it("still discovers the account with no redelegation when the chain read fails", async () => {
    usedAccountsOf(chain, 1);
    mockGetRedelegations.mockRejectedValue(new Error("lcd unavailable"));

    const [account] = await scanRecordedDevice(chain);

    expect(account).toMatchObject({
      freshAddress: first.address,
      used: true,
      stakingResources: { redelegations: [] },
    });
  });

  it("scans as many accounts as the recorded device holds", async () => {
    usedAccountsOf(chain, chain.accounts.length);

    const accounts = await scanRecordedDevicePrefix(chain);

    expect(accounts.map(a => [a.freshAddress, a.used])).toEqual(
      chain.accounts.map(account => [account.address, true]),
    );
  });

  it("keeps the seed key as the identifier of the second account", async () => {
    usedAccountsOf(chain, chain.accounts.length - 1);

    const accounts = await scanRecordedDevice(chain);

    expect(accounts[1]).toMatchObject({
      id: `js:2:${chain.currencyId}:${second.address}:`,
      xpub: second.publicKey,
      seedIdentifier: first.publicKey,
      freshAddress: second.address,
      freshAddressPath: second.path,
      index: 1,
    });
  });

  it("ends the scan with a single empty account", async () => {
    usedAccountsOf(chain, chain.accounts.length - 1);

    const accounts = await scanRecordedDevice(chain);

    expect(accounts.map(a => a.used)).toEqual(
      chain.accounts.map((_, index) => index < chain.accounts.length - 1),
    );
  });

  it("proposes the first account as the account to create when the device holds nothing", async () => {
    usedAccountsOf(chain, 0);

    const accounts = await scanRecordedDevice(chain);

    expect(accounts.map(a => [a.index, a.used])).toEqual([[0, false]]);
  });
});

describe("cosmos scanAccounts through the currency bridge and a replayed device", () => {
  const [{ currencyId, accounts }] = DEVICE_CHAINS;
  const [first] = accounts;

  const scanThroughDevice = async (): Promise<Account[]> => {
    mockUsedAddresses.clear();
    const deviceId = await mockDeviceWithAPDUs(first.apdus + first.apdus);
    const currency = getCryptoCurrencyById(currencyId);
    const bridge = await getCurrencyBridge(currency);
    const events = await lastValueFrom(
      bridge
        .scanAccounts({
          currency,
          deviceId,
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );
    releaseMockDevice(deviceId);
    return events
      .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
        return event.type === "discovered";
      })
      .map(event => event.account);
  };

  it("discovers the account of the device with the address the device returned", async () => {
    const [account] = await scanThroughDevice();

    expect(account).toMatchObject({
      id: `js:2:${currencyId}:${first.address}:`,
      freshAddress: first.address,
      freshAddressPath: first.path,
      xpub: first.publicKey,
      seedIdentifier: first.publicKey,
    });
  });

  it("creates a cosmos send transaction for the scanned account", async () => {
    const [account] = await scanThroughDevice();

    expect(createTransaction(account)).toEqual({
      family: "cosmos",
      mode: "send",
      amount: new BigNumber(0),
      recipient: "",
      fees: null,
      useAllAmount: false,
      memoType: null,
      memoValue: null,
      networkInfo: null,
    });
  });
});
