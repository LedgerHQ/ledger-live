import { NEAR_BASE_URL_MOCKED } from "../network/node.mock";
import { getBalance } from "../logic/account/getBalance";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { broadcast } from "../logic/transaction/broadcast";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateIntent } from "../logic/transaction/validateIntent";
import { createApi } from "./index";

jest.mock("../logic/account/getBalance", () => ({ getBalance: jest.fn() }));
jest.mock("../logic/history/getBlockInfo", () => ({ getBlockInfo: jest.fn() }));
jest.mock("../logic/history/lastBlock", () => ({ lastBlock: jest.fn() }));
jest.mock("../logic/history/listOperations", () => ({ listOperations: jest.fn() }));
jest.mock("../logic/staking/getStakes", () => ({ getStakes: jest.fn() }));
jest.mock("../logic/staking/getValidators", () => ({ getValidators: jest.fn() }));
jest.mock("../logic/transaction/broadcast", () => ({ broadcast: jest.fn() }));
jest.mock("../logic/transaction/craftTransaction", () => ({ craftTransaction: jest.fn() }));
jest.mock("../logic/transaction/estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../logic/transaction/validateIntent", () => ({ validateIntent: jest.fn() }));

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
  const api = createApi(config, "near");

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

  it("declares staking support, which is what makes the framework read validators", () => {
    expect(api.stakingSupported).toBe(true);
  });

  describe("delegates each method to its implementation", () => {
    const intent = { intentType: "transaction", sender: "sender.near" } as never;

    beforeEach(() => jest.clearAllMocks());

    it("forwards the read methods", async () => {
      await api.lastBlock();
      expect(lastBlock).toHaveBeenCalled();

      await api.getBlockInfo(42);
      expect(getBlockInfo).toHaveBeenCalledWith(42);

      await api.listOperations("sender.near", { minHeight: 7 });
      expect(listOperations).toHaveBeenCalledWith("sender.near", { minHeight: 7 });

      await api.getStakes("sender.near", "cursor");
      expect(getStakes).toHaveBeenCalledWith("sender.near", "cursor");

      await api.getValidators("cursor");
      expect(getValidators).toHaveBeenCalledWith("cursor");
    });

    it("forwards getBalance and rejects unsupported balance options", async () => {
      (getBalance as jest.Mock).mockResolvedValue([]);

      await api.getBalance("sender.near");
      expect(getBalance).toHaveBeenCalledWith("sender.near");

      await expect(
        api.getBalance("sender.near", { includeAssets: async () => true }),
      ).rejects.toThrow("getBalance does not support the options parameter");
    });

    it("forwards the transaction lifecycle methods", async () => {
      const fees = { value: 1n };

      await api.craftTransaction(intent, fees);
      expect(craftTransaction).toHaveBeenCalledWith(intent, fees);

      await api.estimateFees(intent, { gasPrice: "1" });
      expect(estimateFees).toHaveBeenCalledWith(intent, { gasPrice: "1" });

      await api.broadcast("signed-tx");
      expect(broadcast).toHaveBeenCalledWith("signed-tx", undefined);

      await api.validateIntent(intent, [], fees);
      expect(validateIntent).toHaveBeenCalledWith(intent, [], fees);
    });
  });

  it("validates an address format on the spot", async () => {
    await expect(api.validateAddress("recipient.near", {})).resolves.toBe(true);
    await expect(api.validateAddress("NOT VALID", {})).resolves.toBe(false);
  });

  it("does not support reading a block's transactions", () => {
    expect(() => api.getBlock(1)).toThrow("getBlock is not supported");
  });

  it("does not support rewards, which a staking pool compounds into the staked balance", () => {
    expect(() => api.getRewards("sender.near")).toThrow("getRewards is not supported");
  });

  it("explains why an account-level nonce is not available", () => {
    expect(() => api.getNextSequence("sender.near")).toThrow(
      "the nonce belongs to an access key, not to an account",
    );
  });

  it("does not support crafting from a raw transaction", () => {
    expect(() => api.craftRawTransaction("", "", "", 0n)).toThrow(
      "craftRawTransaction is not supported",
    );
  });

  it("does not support contract calls", async () => {
    await expect(api.call({})).rejects.toThrow("call is not supported");
  });
});
