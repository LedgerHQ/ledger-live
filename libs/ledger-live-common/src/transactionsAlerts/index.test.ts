import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, ChainwatchNetwork } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "../bridge/index";
import ChainwatchAccountManager from "./ChainwatchAccountManager";
import {
  getTransactionsAlertsAddresses,
  getTransactionsAlertsAddressKey,
  reconcileTransactionsAlertsAddresses,
  resolveTransactionsAlertsAddresses,
} from ".";

jest.mock("./ChainwatchAccountManager");
jest.mock("../bridge/index", () => ({ getAccountBridge: jest.fn() }));

const MockedChainwatchAccountManager = jest.mocked(ChainwatchAccountManager);
const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const avalanche = getCryptoCurrencyById("avalanche_c_chain");
const network: ChainwatchNetwork = {
  ledgerLiveId: avalanche.id,
  chainwatchId: "avax",
  nbConfirmations: 1,
};

const makeAccount = (id: string, freshAddress: string): Account => ({
  ...genAccount(id, { currency: avalanche }),
  freshAddress,
});
const makeAddress = (address: string) => ({ currencyId: avalanche.id, address });

describe("getTransactionsAlertsAddressKey", () => {
  it("should lowercase hexadecimal addresses", () => {
    expect(getTransactionsAlertsAddressKey("ethereum", "0xAbCd")).toBe("ethereum:0xabcd");
  });

  it("should preserve case-sensitive addresses", () => {
    expect(getTransactionsAlertsAddressKey("solana", "AbCd")).toBe("solana:AbCd");
  });
});

describe("getTransactionsAlertsAddresses", () => {
  it("should ignore accounts without an address", () => {
    expect(getTransactionsAlertsAddresses([makeAccount("account", "")])).toEqual([]);
  });
});

describe("resolveTransactionsAlertsAddresses", () => {
  const mockOwnedAddresses = (ownedAddresses: Record<string, string[]>) => {
    mockedGetAccountBridge.mockImplementation(
      async () =>
        ({
          getOwnedAddresses: async (account: Account) => ownedAddresses[account.freshAddress],
        }) as unknown as Awaited<ReturnType<typeof getAccountBridge>>,
    );
  };

  it("should return every address owned by each account", async () => {
    mockOwnedAddresses({
      "0x01": ["0x01", "0x0a"],
      "0x02": ["0x02"],
    });

    const addresses = await resolveTransactionsAlertsAddresses([
      makeAccount("account-1", "0x01"),
      makeAccount("account-2", "0x02"),
    ]);

    expect(addresses).toEqual([makeAddress("0x01"), makeAddress("0x0a"), makeAddress("0x02")]);
  });

  it("should return an address shared by several accounts once", async () => {
    mockOwnedAddresses({ "0x01": ["0x01", "0xAB"], "0x02": ["0x02", "0xab"] });

    const addresses = await resolveTransactionsAlertsAddresses([
      makeAccount("account-1", "0x01"),
      makeAccount("account-2", "0x02"),
    ]);

    expect(addresses.map(({ address }) => address.toLowerCase())).toEqual(["0x01", "0xab", "0x02"]);
  });

  it("should reject when the addresses of an account cannot be resolved", async () => {
    const error = new Error("bridge unavailable");
    mockedGetAccountBridge.mockRejectedValueOnce(error);

    await expect(resolveTransactionsAlertsAddresses([makeAccount("account", "0x01")])).rejects.toBe(
      error,
    );
  });
});

describe("reconcileTransactionsAlertsAddresses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reconcile every current address when accounts were already known locally", async () => {
    const accounts = [makeAccount("account-1", "0x01"), makeAccount("account-2", "0x02")];

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      getTransactionsAlertsAddresses(accounts),
      getTransactionsAlertsAddresses(accounts),
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.setupChainwatchAccount).toHaveBeenCalledTimes(1);
    expect(accountManager.registerNewAddresses).toHaveBeenCalledWith(["0x01", "0x02"]);
    expect(accountManager.removeAddresses).toHaveBeenCalledWith([]);
  });

  it("should remove an old address when an account address changes", async () => {
    const previousAccount = makeAccount("account", "0x01");
    const currentAccount = makeAccount("account", "0x02");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      getTransactionsAlertsAddresses([currentAccount]),
      getTransactionsAlertsAddresses([previousAccount]),
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.registerNewAddresses).toHaveBeenCalledWith(["0x02"]);
    expect(accountManager.removeAddresses).toHaveBeenCalledWith(["0x01"]);
    expect(accountManager.removeAddresses.mock.invocationCallOrder[0]).toBeLessThan(
      accountManager.registerNewAddresses.mock.invocationCallOrder[0],
    );
  });

  it("should not remove an address that is still present under another account id", async () => {
    const previousAccount = makeAccount("previous-account", "0x01");
    const currentAccount = makeAccount("current-account", "0x01");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      getTransactionsAlertsAddresses([currentAccount]),
      getTransactionsAlertsAddresses([previousAccount]),
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.registerNewAddresses).toHaveBeenCalledWith(["0x01"]);
    expect(accountManager.removeAddresses).toHaveBeenCalledWith([]);
  });

  it("should reconcile a shared address only once", async () => {
    const firstAccount = makeAccount("first-account", "0x01");
    const secondAccount = makeAccount("second-account", "0x01");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      getTransactionsAlertsAddresses([firstAccount, secondAccount]),
      [],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.registerNewAddresses).toHaveBeenCalledWith(["0x01"]);
  });

  it("should remove a shared address only once", async () => {
    const firstAccount = makeAccount("first-account", "0x01");
    const secondAccount = makeAccount("second-account", "0x01");
    jest
      .mocked(MockedChainwatchAccountManager.prototype.loadChainwatchAccount)
      .mockResolvedValueOnce({
        suffixes: ["0x01"],
        monitors: [],
        targets: [],
      });

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [],
      getTransactionsAlertsAddresses([firstAccount, secondAccount]),
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.removeAddresses).toHaveBeenCalledWith(["0x01"]);
  });

  it("should reject when an address cannot be registered", async () => {
    const error = new Error("Chainwatch unavailable");
    jest
      .mocked(MockedChainwatchAccountManager.prototype.registerNewAddresses)
      .mockRejectedValueOnce(error);

    await expect(
      reconcileTransactionsAlertsAddresses(
        "user-id",
        "https://chainwatch",
        [network],
        [makeAddress("0x01")],
        [],
      ),
    ).rejects.toBe(error);
  });

  it("should not recreate a missing account for removal-only reconciliation", async () => {
    jest
      .mocked(MockedChainwatchAccountManager.prototype.loadChainwatchAccount)
      .mockResolvedValueOnce(undefined);

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [],
      [makeAddress("0x01")],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.setupChainwatchAccount).not.toHaveBeenCalled();
    expect(accountManager.registerNewChainwatchAccount).not.toHaveBeenCalled();
    expect(accountManager.removeAddresses).not.toHaveBeenCalled();
  });
});
