import { NEAR_BASE_URL_MOCKED } from "../network/node.mock";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { broadcast } from "../logic/broadcast";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";
import { createMockNearContext } from "../test/context";
import { createApi } from "./index";

jest.mock("../logic/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/getBlockInfo", () => ({ getBlockInfo: jest.fn() }));
jest.mock("../logic/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/getStakes", () => ({ getStakes: jest.fn() }));
jest.mock("../logic/getValidators", () => ({ getValidators: jest.fn() }));
jest.mock("../logic/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/validateIntent", () => ({ validateIntent: jest.fn() }));

const config = () => ({
  status: { type: "active" as const },
  infra: {
    API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
    API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
    API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
    API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
  },
});

describe("createApi", () => {
  const api = createApi();
  const context = createMockNearContext();

  it("exposes every CoinModuleApi method", () => {
    const methods = [
      "lastBlock",
      "getBlockInfo",
      "getBlock",
      "call",
      "getValidators",
      "getBalance",
      "listOperations",
      "getStakes",
      "getRewards",
      "craftTransaction",
      "craftRawTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "validateIntent",
      "getNextSequence",
      "validateAddress",
      "craftTransactionData",
    ];

    for (const method of methods) {
      expect(typeof api[method as keyof typeof api]).toBe("function");
    }
  });

  describe("delegates each method to its implementation", () => {
    const intent = { intentType: "transaction", sender: "sender.near" } as never;

    beforeEach(() => jest.clearAllMocks());

    it("forwards the read methods", async () => {
      await api.lastBlock(context);
      expect(lastBlock).toHaveBeenCalled();

      await api.getBlockInfo(context, 42);
      expect(getBlockInfo).toHaveBeenCalledWith(context, 42);

      await api.listOperations(context, "sender.near", { minHeight: 7 });
      expect(listOperations).toHaveBeenCalledWith(context, "sender.near", { minHeight: 7 });

      await api.getStakes(context, "sender.near", { cursor: "cursor" });
      expect(getStakes).toHaveBeenCalledWith(context, "sender.near", "cursor");

      await api.getValidators(context, { cursor: "cursor" });
      expect(getValidators).toHaveBeenCalledWith(context, "cursor");
    });

    it("forwards getBalance and rejects unsupported balance options", async () => {
      (getBalance as jest.Mock).mockResolvedValue([]);

      await api.getBalance(context, "sender.near");
      expect(getBalance).toHaveBeenCalledWith(context, "sender.near");

      await expect(
        api.getBalance(context, "sender.near", { includeAssets: async () => true }),
      ).rejects.toThrow("getBalance does not support the options parameter");
    });

    it("forwards the transaction lifecycle methods", async () => {
      const fees = { value: 1n };

      await api.craftTransaction(context, intent, { customFees: fees });
      expect(craftTransaction).toHaveBeenCalledWith(context, intent, fees);

      await api.estimateFees(context, intent, { customFeesParameters: { gasPrice: "1" } });
      expect(estimateFees).toHaveBeenCalledWith(context, intent, { gasPrice: "1" });

      await api.broadcast(context, "signed-tx");
      expect(broadcast).toHaveBeenCalledWith(context, "signed-tx", undefined);

      await api.validateIntent(context, intent, [], { customFees: fees });
      expect(validateIntent).toHaveBeenCalledWith(context, intent, [], fees);
    });
  });

  it("validates an address format on the spot", async () => {
    await expect(api.validateAddress(context, "recipient.near", {})).resolves.toBe(true);
    await expect(api.validateAddress(context, "NOT VALID", {})).resolves.toBe(false);
  });

  it("does not support reading a block's transactions", () => {
    expect(() => api.getBlock(context, 1)).toThrow("getBlock is not supported");
  });

  it("does not support rewards, which a staking pool compounds into the staked balance", () => {
    expect(() => api.getRewards(context, "sender.near")).toThrow("getRewards is not supported");
  });

  it("explains why an account-level nonce is not available", () => {
    expect(() => api.getNextSequence(context, "sender.near")).toThrow(
      "the nonce belongs to an access key, not to an account",
    );
  });

  it("does not support crafting from a raw transaction", () => {
    expect(() => api.craftRawTransaction(context, "", "", "", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("does not support contract calls", async () => {
    await expect(api.call(context, {})).rejects.toThrow("call is not supported");
  });
});
