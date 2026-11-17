import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { AccountDescriptorSchema, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { createCoinModuleSource } from "@features/platform-account-source-coin-module";
import network from "@ledgerhq/live-network";
import { createCoinModuleHost } from "../../account-data/coin-module/createCoinModuleHost";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import { getCurrencyConfiguration } from "../../config";

jest.mock("@ledgerhq/live-network");
jest.mock("../../config", () => ({ getCurrencyConfiguration: jest.fn() }));

// The coin-aleo testnet fixture account.
const address = "aleo1uhf67fhy46jvv5hadf586pkdarax6ppuzq8xtpk7jdk9hhujku8sfa39ml";
const viewKey = "AViewKey1jyaKC65RhaGN3b6h79hLdwTBk3YAMbRL1MMeCArLDJ6E";

const descriptorOf = (key: string): AccountDescriptor =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: "aleo",
    key,
    path: "m/44h/683h/0h/0h",
  });

/** Answers the public balance mapping and the public transactions of the address, failing any other call. */
function servePublicState({
  balance,
  transactions,
}: {
  balance: string | null;
  transactions: number;
}) {
  jest.mocked(network).mockImplementation(async ({ url }) => {
    if (url?.endsWith(`/mapping/account/${address}`)) return { data: balance, status: 200 };
    if (url?.includes(`/transactions/address/${address}?`)) {
      return {
        data: { transactions: Array.from({ length: transactions }, () => ({})) },
        status: 200,
      };
    }
    throw new Error(`unexpected call to ${url}`);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getCurrencyConfiguration).mockReturnValue({
    name: "Aleo",
    unit: { name: "Aleo", code: "ALEO", magnitude: 6 },
    networkType: "mainnet",
    apiUrls: { node: "https://node.example.com", sdk: "https://sdk.example.com" },
    status: { type: "active" },
  });
  resetCoinModulesForTests();
  registerCoinModules(coinModuleLoaders.filter(({ family }) => family === "aleo"));
});

afterAll(() => resetCoinModulesForTests());

describe("Aleo account status, read on the public state by the coin module", () => {
  it.each([
    ["the address alone, as a discovery candidate", address],
    ["the address and the view key", `${address}.${viewKey}`],
  ])("reaches coin-aleo getAccountStatus from a key holding %s", async (_, key) => {
    servePublicState({ balance: "10u64", transactions: 0 });

    const api = await createCoinModuleHost().getAccountStatusApi?.("aleo");

    await expect(api?.getAccountStatus(key)).resolves.toEqual({ used: true });
    expect(network).toHaveBeenCalledTimes(2);
  });

  it("reads an account with no public balance and no public transaction as unused", async () => {
    servePublicState({ balance: null, transactions: 0 });

    const api = await createCoinModuleHost().getAccountStatusApi?.("aleo");

    await expect(api?.getAccountStatus(address)).resolves.toEqual({ used: false });
  });

  it("is answered by the coin-module source, never by a sync of the next source", async () => {
    servePublicState({ balance: "0u64", transactions: 1 });
    const fullSyncStatus = jest.fn();
    const fullSync: AccountDataSource = {
      id: AccountDataSourceIdSchema.parse("full-sync"),
      supports: () => true,
      read: { accountStatus: fullSyncStatus },
    };
    const router = createAccountDataRouter([
      createCoinModuleSource(createCoinModuleHost()),
      fullSync,
    ]);

    await expect(router.read("accountStatus", descriptorOf(address))).resolves.toEqual({
      data: { used: true, gate: null },
      sourceId: "coin-module",
    });
    expect(fullSyncStatus).not.toHaveBeenCalled();
  });

  it("leaves the balance to the legacy bridge, which reads it with the view key", async () => {
    await expect(createCoinModuleHost().getApi("aleo")).resolves.toBeUndefined();
  });
});
