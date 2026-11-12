import { preload } from "./preload";
import * as network from "./network/node";
import * as protocolConfig from "./network/protocolConfig";
import * as preloadData from "./preload-data";

jest.mock("./config", () => ({ getCoinConfig: () => ({}) }));
jest.mock("./network/node", () => ({ getValidators: jest.fn(), getGasPrice: jest.fn() }));
jest.mock("./network/protocolConfig", () => ({ getActionCosts: { force: jest.fn() } }));

const mocked = network as jest.Mocked<typeof network>;

beforeEach(() => {
  (protocolConfig.getActionCosts.force as jest.Mock).mockResolvedValue({});
  mocked.getGasPrice.mockResolvedValue("100000000");
});

describe("preload", () => {
  it("keeps the previous validator list when the indexer cannot serve it", async () => {
    const previous = [{ validatorAddress: "kept.poolv1.near", tokens: "1", commission: 1 }];
    preloadData.setNearPreloadData({
      ...preloadData.getCurrentNearPreloadData(),
      validators: previous,
    });
    mocked.getValidators.mockRejectedValue(new Error("429"));

    const data = await preload();

    expect(data.validators).toEqual(previous);
    expect(data.gasPrice.toFixed()).toBe("100000000");
  });

  it("uses the fresh list when the indexer serves it", async () => {
    mocked.getValidators.mockResolvedValue([
      { account_id: "fresh.poolv1.near", stake: "2", commission: 3 },
    ]);

    const data = await preload();

    expect(data.validators).toEqual([
      { validatorAddress: "fresh.poolv1.near", tokens: "2", commission: 3 },
    ]);
  });
});
