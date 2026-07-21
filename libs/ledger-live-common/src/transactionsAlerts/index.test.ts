import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, ChainwatchNetwork } from "@ledgerhq/types-live";
import ChainwatchAccountManager from "./ChainwatchAccountManager";
import { getTransactionsAlertsAddressKey, reconcileTransactionsAlertsAddresses } from ".";

jest.mock("./ChainwatchAccountManager");

const MockedChainwatchAccountManager = jest.mocked(ChainwatchAccountManager);
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

describe("getTransactionsAlertsAddressKey", () => {
  it("should lowercase hexadecimal addresses", () => {
    expect(getTransactionsAlertsAddressKey("ethereum", "0xAbCd")).toBe("ethereum:0xabcd");
  });

  it("should preserve case-sensitive addresses", () => {
    expect(getTransactionsAlertsAddressKey("solana", "AbCd")).toBe("solana:AbCd");
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
      accounts,
      [...accounts],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.setupChainwatchAccount).toHaveBeenCalledTimes(1);
    expect(accountManager.registerNewAccountsAddresses).toHaveBeenCalledWith(accounts);
    expect(accountManager.removeAccountsAddresses).toHaveBeenCalledWith([]);
  });

  it("should remove an old address when an account address changes", async () => {
    const previousAccount = makeAccount("account", "0x01");
    const currentAccount = makeAccount("account", "0x02");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [currentAccount],
      [previousAccount],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.registerNewAccountsAddresses).toHaveBeenCalledWith([currentAccount]);
    expect(accountManager.removeAccountsAddresses).toHaveBeenCalledWith([previousAccount]);
  });

  it("should not remove an address that is still present under another account id", async () => {
    const previousAccount = makeAccount("previous-account", "0x01");
    const currentAccount = makeAccount("current-account", "0x01");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [currentAccount],
      [previousAccount],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    expect(accountManager.registerNewAccountsAddresses).toHaveBeenCalledWith([currentAccount]);
    expect(accountManager.removeAccountsAddresses).toHaveBeenCalledWith([]);
  });

  it("should reconcile a shared address only once", async () => {
    const firstAccount = makeAccount("first-account", "0x01");
    const secondAccount = makeAccount("second-account", "0x01");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [firstAccount, secondAccount],
      [],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    const [accountsToRegister] = accountManager.registerNewAccountsAddresses.mock.calls[0];
    expect(accountsToRegister).toHaveLength(1);
    expect(accountsToRegister[0].freshAddress).toBe("0x01");
  });

  it("should remove a shared address only once", async () => {
    const firstAccount = makeAccount("first-account", "0x01");
    const secondAccount = makeAccount("second-account", "0x01");

    await reconcileTransactionsAlertsAddresses(
      "user-id",
      "https://chainwatch",
      [network],
      [],
      [firstAccount, secondAccount],
    );

    const accountManager = jest.mocked(MockedChainwatchAccountManager.mock.instances[0]);
    const [accountsToRemove] = accountManager.removeAccountsAddresses.mock.calls[0];
    expect(accountsToRemove).toHaveLength(1);
    expect(accountsToRemove[0].freshAddress).toBe("0x01");
  });

  it("should reject when an address cannot be registered", async () => {
    const error = new Error("Chainwatch unavailable");
    jest
      .mocked(MockedChainwatchAccountManager.prototype.registerNewAccountsAddresses)
      .mockRejectedValueOnce(error);

    await expect(
      reconcileTransactionsAlertsAddresses(
        "user-id",
        "https://chainwatch",
        [network],
        [makeAccount("account", "0x01")],
        [],
      ),
    ).rejects.toBe(error);
  });
});
