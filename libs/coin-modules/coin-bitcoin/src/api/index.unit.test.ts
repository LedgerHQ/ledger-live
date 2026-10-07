import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { optionalApiKeys, withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import type {
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinTxData } from "../logic/intent";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlock } from "../logic/getBlock";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateIntent } from "../logic/validateIntent";
import { testContext } from "../logic/tests/helpers/msw";
import { createApi } from "./index";

jest.mock("../logic/broadcast");
jest.mock("../logic/combine");
jest.mock("../logic/craftTransaction");
jest.mock("../logic/estimateFees");
jest.mock("../logic/getBalance");
jest.mock("../logic/getBlock");
jest.mock("../logic/getBlockInfo");
jest.mock("../logic/lastBlock");
jest.mock("../logic/listOperations");
jest.mock("../logic/validateIntent");

const SUPPORTED = ["getBlock", "getBlockInfo", "validateIntent"];

const intent: TransactionIntent<MemoNotSupported, BitcoinTxData> = {
  intentType: "transaction",
  type: "send",
  sender: "a",
  recipient: "b",
  amount: 1n,
  asset: { type: "native" },
  data: { type: "string" },
};

describe("createApi", () => {
  const context = testContext();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each(SUPPORTED)("supports %s", method => {
    expect(withDefaults(createApi("bitcoin")).supports(method as never)).toBe(true);
  });

  it.each(optionalApiKeys.filter(key => !SUPPORTED.includes(key) && key !== "getAccountInfo"))(
    "does not support %s",
    method => {
      expect(withDefaults(createApi("bitcoin")).supports(method)).toBe(false);
    },
  );

  it("answers getAccountInfo with the no-metadata sentinel", async () => {
    await expect(
      withDefaults(createApi("bitcoin")).getAccountInfo(context, "addr"),
    ).resolves.toEqual({
      type: "none",
    });
  });

  it("implements every method the authoring type requires", () => {
    const api = createApi("bitcoin");
    for (const method of [
      "lastBlock",
      "getBalance",
      "listOperations",
      "craftTransaction",
      "estimateFees",
      "combine",
      "broadcast",
      "craftTransactionData",
    ] as const) {
      expect(typeof api[method]).toBe("function");
    }
  });

  it("delegates listOperations with the instance's currency", async () => {
    jest.mocked(listOperations).mockImplementation(async () => ({ items: [] }));
    const options = { minHeight: 10, order: "asc" as const };
    await createApi("litecoin").listOperations(context, "addr", options);
    expect(listOperations).toHaveBeenCalledWith(context, "litecoin", "addr", options);
  });

  it("delegates craftTransaction with the custom fees", async () => {
    jest.mocked(craftTransaction).mockImplementation(async () => ({ transaction: "psbt" }));
    await createApi("bitcoin_cash").craftTransaction(context, intent, {
      customFees: { value: 5n },
    });
    expect(craftTransaction).toHaveBeenCalledWith(context, "bitcoin_cash", intent, { value: 5n });
  });

  it("delegates combine with the instance's currency and the public key", () => {
    jest.mocked(combine).mockImplementation(() => "signed");
    expect(createApi("bitcoin").combine(context, "psbt", ["sig"], { pubkey: "02ab" })).toBe(
      "signed",
    );
    expect(combine).toHaveBeenCalledWith("bitcoin", "psbt", ["sig"], "02ab");
  });

  it("rejects getBalance options", async () => {
    await expect(
      createApi("bitcoin").getBalance(context, "addr", { assetFilter: [] } as never),
    ).rejects.toBeInstanceOf(InvalidParameterError);
    expect(getBalance).not.toHaveBeenCalled();
  });

  it("delegates getBalance with the instance's currency", async () => {
    jest.mocked(getBalance).mockImplementation(async () => []);
    await createApi("litecoin").getBalance(context, "addr");
    expect(getBalance).toHaveBeenCalledWith(context, "litecoin", "addr");
  });

  it("delegates the block methods with the instance's currency", async () => {
    const api = createApi("dogecoin");
    await api.lastBlock(context);
    await api.getBlockInfo(context, 5);
    await api.getBlock(context, 6);
    expect(lastBlock).toHaveBeenCalledWith(context, "dogecoin");
    expect(getBlockInfo).toHaveBeenCalledWith(context, "dogecoin", 5);
    expect(getBlock).toHaveBeenCalledWith(context, "dogecoin", 6);
  });

  it("delegates validateIntent with the custom fees", async () => {
    await createApi("bitcoin").validateIntent(context, intent, [], { customFees: { value: 3n } });
    expect(validateIntent).toHaveBeenCalledWith(context, "bitcoin", intent, [], { value: 3n });
  });

  it("delegates estimateFees with the custom fee parameters", async () => {
    jest.mocked(estimateFees).mockImplementation(async () => ({ value: 1n }));
    await createApi("litecoin").estimateFees(context, intent, {
      customFeesParameters: { feePerByte: 2n },
    });
    expect(estimateFees).toHaveBeenCalledWith(context, "litecoin", intent, { feePerByte: 2n });
  });

  it("delegates broadcast with the broadcast config", async () => {
    const broadcastConfig = { mevProtected: false, source: { type: "swap" as const, name: "x" } };
    await createApi("bitcoin_cash").broadcast(context, "00", { broadcastConfig });
    expect(broadcast).toHaveBeenCalledWith(context, "bitcoin_cash", "00", broadcastConfig);
  });

  it("returns the intent's bitcoin data, OP_RETURN data included", () => {
    const api = createApi("bitcoin");
    expect(api.craftTransactionData(context, intent)).toEqual({ type: "string" });
    expect(
      api.craftTransactionData(context, {
        ...intent,
        data: { type: "string", opReturnData: "abcd" },
      }),
    ).toEqual({ type: "string", opReturnData: "abcd" });
  });
});
