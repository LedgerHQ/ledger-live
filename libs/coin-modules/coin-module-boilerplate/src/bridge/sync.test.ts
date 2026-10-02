import { Account } from "@ledgerhq/types-live";
import { DEFAULT_MAX_TX_QUERY } from "../config";
import { createBoilerplateCoinConfig, createBoilerplateContext } from "../config.fixture";
import { getTransactions } from "../network/indexer";
import { getAccountInfo, getBlockHeight } from "../network/node";
import { makeGetAccountShape } from "./sync";

jest.mock("../network/node");
jest.mock("../network/indexer");

const info = {
  address: "address",
  currency: { id: "boilerplate" },
  derivationMode: "",
  initialAccount: undefined as Account | undefined,
} as unknown as Parameters<ReturnType<typeof makeGetAccountShape>>[0];

const syncConfig = { blacklistedTokenIds: [], paginationConfig: {} };

describe("makeGetAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getBlockHeight).mockResolvedValue(10);
    jest.mocked(getAccountInfo).mockResolvedValue({ account_data: { Balance: "1000" } } as never);
    jest.mocked(getTransactions).mockResolvedValue([]);
  });

  it("requests the default page limit when the config sets none", async () => {
    await makeGetAccountShape(createBoilerplateContext())(info, syncConfig);

    expect(getTransactions).toHaveBeenCalledWith(createBoilerplateCoinConfig(), "address", {
      minHeight: 0,
      limit: DEFAULT_MAX_TX_QUERY,
    });
  });

  it("requests the page limit from the config", async () => {
    const context = createBoilerplateContext({ indexer: { url: "https://i", maxTxQuery: 7 } });

    await makeGetAccountShape(context)(info, syncConfig);

    expect(jest.mocked(getTransactions).mock.calls[0][2]).toEqual({ minHeight: 0, limit: 7 });
  });

  it("subtracts the configured reserve from the spendable balance", async () => {
    const context = createBoilerplateContext({ minReserve: 100 });

    const shape = await makeGetAccountShape(context)(info, syncConfig);

    expect(shape.spendableBalance?.toNumber()).toEqual(900);
  });
});
