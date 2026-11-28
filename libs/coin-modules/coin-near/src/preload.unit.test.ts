import { getValidators, getGasPrice } from "./network/node";
import { getActionCosts } from "./network/protocolConfig";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";

jest.mock("./config", () => ({ getCoinConfig: () => ({}) }));
jest.mock("./network/node", () => ({ getValidators: jest.fn(), getGasPrice: jest.fn() }));
jest.mock("./network/protocolConfig", () => ({ getActionCosts: { force: jest.fn() } }));

const mockedGetValidators = jest.mocked(getValidators);
const mockedGetGasPrice = jest.mocked(getGasPrice);
const initialData = getCurrentNearPreloadData();

describe("preload", () => {
  beforeEach(() => {
    setNearPreloadData(initialData);
    (getActionCosts.force as jest.Mock).mockResolvedValue({});
    mockedGetGasPrice.mockResolvedValue("100000000");
  });

  it("resolves the gas price and the protocol costs without fetching validators", async () => {
    const data = await preload();

    expect(data.gasPrice.toFixed()).toBe("100000000");
    expect(data).not.toHaveProperty("validators");
    expect(mockedGetValidators).not.toHaveBeenCalled();
  });

  it("rejects when the gas price cannot be read, since fees need it", async () => {
    mockedGetGasPrice.mockRejectedValue(new Error("no gas price"));

    await expect(preload()).rejects.toThrow("no gas price");
  });
});

describe("hydrate", () => {
  beforeEach(() => {
    setNearPreloadData(initialData);
  });

  it("restores the numeric fields from serialized data", () => {
    hydrate({
      storageCost: "10",
      gasPrice: "20",
      createAccountCostSend: "1",
      createAccountCostExecution: "2",
      transferCostSend: "3",
      transferCostExecution: "4",
      addKeyCostSend: "5",
      addKeyCostExecution: "6",
      receiptCreationSend: "7",
      receiptCreationExecution: "8",
      minGasPurchasePrice: "9",
      accountCreationCharge: "11",
    });

    const data = getCurrentNearPreloadData();
    expect(data.storageCost.toFixed()).toBe("10");
    expect(data.gasPrice.toFixed()).toBe("20");
    expect(data.createAccountCostSend.toFixed()).toBe("1");
    expect(data.createAccountCostExecution.toFixed()).toBe("2");
    expect(data.transferCostSend.toFixed()).toBe("3");
    expect(data.transferCostExecution.toFixed()).toBe("4");
    expect(data.addKeyCostSend.toFixed()).toBe("5");
    expect(data.addKeyCostExecution.toFixed()).toBe("6");
    expect(data.receiptCreationSend.toFixed()).toBe("7");
    expect(data.receiptCreationExecution.toFixed()).toBe("8");
    expect(data.minGasPurchasePrice.toFixed()).toBe("9");
    expect(data.accountCreationCharge.toFixed()).toBe("11");
  });

  it("drops a validator list serialized by an older version", () => {
    hydrate({ gasPrice: "20", validators: [{ validatorAddress: "old.poolv1.near" }] });

    expect(getCurrentNearPreloadData()).not.toHaveProperty("validators");
  });

  it("keeps the current data when nothing usable is serialized", () => {
    hydrate(null);

    expect(getCurrentNearPreloadData()).toEqual(initialData);
  });
});

describe("getPreloadStrategy", () => {
  it("refreshes the preload every 30 minutes", () => {
    expect(getPreloadStrategy()).toEqual({ preloadMaxAge: 30 * 60 * 1000 });
  });
});
