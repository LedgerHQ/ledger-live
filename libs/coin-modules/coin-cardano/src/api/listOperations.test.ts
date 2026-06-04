import type {
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CardanoConfig } from "../config";
import { listOperations } from "../logic/listOperations";
import { createApi } from ".";

jest.mock("../logic/listOperations", () => ({
  listOperations: jest.fn(),
}));

const mockListOperations = jest.mocked(listOperations);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const currency = getCryptoCurrencyById("cardano");

const options: ListOperationsOptions = { minHeight: 10, order: "desc" };

const operation: Operation<MemoNotSupported> = {
  id: "cardano-tx-hash",
  type: "IN",
  senders: ["addr1_sender"],
  recipients: ["addr1_me"],
  value: 5000000n,
  asset: { type: "native" },
  tx: {
    hash: "tx-hash",
    block: { height: 100, hash: "", time: new Date(0) },
    fees: 200000n,
    date: new Date(0),
    failed: false,
  },
  details: {},
};

describe("api.listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the logic listOperations with the resolved currency, address and options", async () => {
    const page: Page<Operation<MemoNotSupported>> = { items: [], next: undefined };
    mockListOperations.mockResolvedValue(page);

    const api = createApi(config, "cardano");
    const result = await api.listOperations("addr1_me", options);

    expect(mockListOperations).toHaveBeenCalledTimes(1);
    expect(mockListOperations).toHaveBeenCalledWith(currency, "addr1_me", options);
    expect(result).toBe(page);
  });

  it("returns the page (items and next cursor) produced by the logic layer unchanged", async () => {
    const page: Page<Operation<MemoNotSupported>> = { items: [operation], next: "2" };
    mockListOperations.mockResolvedValue(page);

    const api = createApi(config, "cardano");
    const result = await api.listOperations("addr1_me", options);

    expect(result).toEqual({ items: [operation], next: "2" });
  });

  it("propagates errors thrown by the logic layer", async () => {
    mockListOperations.mockRejectedValue(new Error("network down"));

    const api = createApi(config, "cardano");

    await expect(api.listOperations("addr1_me", options)).rejects.toThrow("network down");
  });
});
