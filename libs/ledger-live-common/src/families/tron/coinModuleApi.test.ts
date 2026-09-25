import { createSponsoredSendApi } from "@ledgerhq/coin-tron/api/index";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { createLocalTronSponsoredApi } from "./coinModuleApi";

jest.mock("@ledgerhq/coin-tron/api/index", () => ({
  createApi: jest.fn(),
  createSponsoredSendApi: jest.fn(),
}));
jest.mock("../../bridge/generic-coin-framework/api/context", () => ({
  buildContext: jest.fn(),
}));

const mockCreateSponsoredSendApi = createSponsoredSendApi as jest.Mock;
const mockBuildContext = buildContext as jest.Mock;

describe("createLocalTronSponsoredApi", () => {
  beforeEach(() => jest.clearAllMocks());

  test("binds a Tron context for the currency and returns the family's sponsored seam", () => {
    const context = { config: jest.fn() };
    const seam = { craftEnergyRentTransaction: jest.fn() };
    mockBuildContext.mockReturnValue(context);
    mockCreateSponsoredSendApi.mockReturnValue(seam);

    const api = createLocalTronSponsoredApi("tron");

    expect(mockBuildContext).toHaveBeenCalledWith("tron");
    expect(mockCreateSponsoredSendApi).toHaveBeenCalledWith(context);
    expect(api).toBe(seam);
  });
});
