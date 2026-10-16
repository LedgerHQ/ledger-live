import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { accountEndpoints } from "./accounts";
import {
  aFailedAccount,
  aLocalNetwork,
  aStoredAccount,
  aStoredPortfolio,
  anAccountData,
  someDeps,
  type FakeNetwork,
} from "./test-utils";

const state = { version: 1, data: { height: 10 } };

const setUp = async () => {
  const bitcoin: FakeNetwork = aLocalNetwork();
  const deps = someDeps({ networks: { bitcoin } });
  await deps.store.put(
    aStoredPortfolio({
      accounts: [
        aStoredAccount({ state }),
        aFailedAccount({ id: "failed" }),
        aStoredAccount({ id: "litecoin", network: "litecoin" }),
      ],
    }),
  );
  const accountData = anAccountData(deps.store);
  return { bitcoin, accountData, ...accountEndpoints(deps) };
};

/** The module methods account-module-utxo adds. */
const utxoModule = (bitcoin: FakeNetwork) =>
  bitcoin.accountModule as FakeNetwork["accountModule"] & {
    getChangeAddress?: jest.Mock;
    getUTXOs?: jest.Mock;
  };

describe("accountEndpoints", () => {
  it("answers where the account receives", async () => {
    const { bitcoin, accountData, getFreshAddress } = await setUp();
    bitcoin.accountModule.getFreshAddress.mockResolvedValue({
      value: { address: "bc1fresh", derivationPath: "84'/0'/0'/0/3" },
      updatedAt: 1,
    });

    expect(await getFreshAddress("portfolio", "account")).toEqual({
      address: "bc1fresh",
      derivation_path: "84'/0'/0'/0/3",
    });
    expect(bitcoin.accountModule.getFreshAddress).toHaveBeenCalledWith(
      bitcoin.context,
      accountData,
    );
  });

  it("answers the next change address of a UTXO account", async () => {
    const { bitcoin, accountData, getChangeAddress } = await setUp();
    const accountModule = utxoModule(bitcoin);
    accountModule.getChangeAddress = jest.fn(async () => ({
      address: "bc1change",
      derivationPath: "84'/0'/0'/1/2",
    }));

    expect(await getChangeAddress("portfolio", "account")).toEqual({
      address: "bc1change",
      derivation_path: "84'/0'/0'/1/2",
    });
    expect(accountModule.getChangeAddress).toHaveBeenCalledWith(bitcoin.context, accountData);
  });

  it("answers every address of the account and whether it holds history", async () => {
    const { bitcoin, accountData, getAccountAddresses } = await setUp();
    bitcoin.accountModule.getAddresses.mockResolvedValue({
      value: [
        { address: "bc1a", derivationPath: "84'/0'/0'/0/0", used: true },
        { address: "bc1b", derivationPath: "84'/0'/0'/0/1", used: false },
      ],
    });

    expect(await getAccountAddresses("portfolio", "account")).toEqual({
      items: [
        { address: "bc1a", derivation_path: "84'/0'/0'/0/0", used: true },
        { address: "bc1b", derivation_path: "84'/0'/0'/0/1", used: false },
      ],
    });
    expect(bitcoin.accountModule.getAddresses).toHaveBeenCalledWith(bitcoin.context, accountData);
  });

  it("answers the unspent outputs of a UTXO account in JSON form", async () => {
    const { bitcoin, accountData, getAccountUtxos } = await setUp();
    const accountModule = utxoModule(bitcoin);
    accountModule.getUTXOs = jest.fn(async () => ({
      value: [
        {
          txid: "tx",
          vout: 1,
          value: 5000n,
          address: "bc1a",
          derivationPath: "84'/0'/0'/0/0",
          height: null,
          replaceable: true,
          change: false,
        },
      ],
      updatedAt: 1,
    }));

    expect(await getAccountUtxos("portfolio", "account")).toEqual({
      items: [
        {
          txid: "tx",
          vout: 1,
          value: "5000",
          address: "bc1a",
          derivationPath: "84'/0'/0'/0/0",
          height: null,
          replaceable: true,
          change: false,
        },
      ],
    });
    expect(accountModule.getUTXOs).toHaveBeenCalledWith(bitcoin.context, accountData);
  });

  it("answers unsupported for the change address and outputs of an account module without them", async () => {
    const { getChangeAddress, getAccountUtxos } = await setUp();

    await expect(getChangeAddress("portfolio", "account")).rejects.toThrow(
      new PortfolioApiError(
        "METHOD_NOT_ALLOWED",
        "getChangeAddress is not served for account account",
      ),
    );
    await expect(getAccountUtxos("portfolio", "account")).rejects.toThrow(
      new PortfolioApiError(
        "METHOD_NOT_ALLOWED",
        "getAccountUtxos is not served for account account",
      ),
    );
  });

  it("rejects an account not served locally as a bad request", async () => {
    const endpoints = await setUp();

    for (const accountId of ["failed", "litecoin"]) {
      const badRequest = new PortfolioApiError(
        "BAD_REQUEST",
        `Account ${accountId} is not served locally`,
      );
      await expect(endpoints.getFreshAddress("portfolio", accountId)).rejects.toThrow(badRequest);
      await expect(endpoints.getChangeAddress("portfolio", accountId)).rejects.toThrow(badRequest);
      await expect(endpoints.getAccountAddresses("portfolio", accountId)).rejects.toThrow(
        badRequest,
      );
      await expect(endpoints.getAccountUtxos("portfolio", accountId)).rejects.toThrow(badRequest);
    }
  });

  it("rejects an unknown account, or portfolio, as not found", async () => {
    const { getFreshAddress } = await setUp();

    await expect(getFreshAddress("portfolio", "unknown")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Account unknown not found"),
    );
    await expect(getFreshAddress("unknown", "account")).rejects.toThrow(
      new PortfolioApiError("NOT_FOUND", "Portfolio unknown not found"),
    );
  });
});
