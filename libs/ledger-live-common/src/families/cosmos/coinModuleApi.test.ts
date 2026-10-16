import { createApi } from "@ledgerhq/coin-cosmos/api/index";
import { createLocalCosmosApi } from "./coinModuleApi";

jest.mock("@ledgerhq/coin-cosmos/api/index", () => ({
  createApi: jest.fn(),
}));

const mockCreateApi = jest.mocked(createApi);

describe("createLocalCosmosApi", () => {
  test("returns the coin module built for the currency, getAccountInfo included", () => {
    const module = { getAccountInfo: jest.fn() };
    mockCreateApi.mockReturnValue(module as unknown as ReturnType<typeof createApi>);

    const api = createLocalCosmosApi("cosmos");

    expect(mockCreateApi).toHaveBeenCalledWith("cosmos");
    expect(api).toBe(module);
  });
});
