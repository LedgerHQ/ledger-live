import { createApi } from "@ledgerhq/coin-solana/api/index";
import { createLocalSolanaApi } from "./coinModuleApi";

jest.mock("@ledgerhq/coin-solana/api/index", () => ({
  createApi: jest.fn(),
}));

const mockCreateApi = jest.mocked(createApi);

describe("createLocalSolanaApi", () => {
  test("returns the coin module built for the currency, getAccountInfo included", () => {
    const module = { getAccountInfo: jest.fn() };
    mockCreateApi.mockReturnValue(module as unknown as ReturnType<typeof createApi>);

    const api = createLocalSolanaApi("solana");

    expect(mockCreateApi).toHaveBeenCalledWith("solana");
    expect(api).toBe(module);
  });
});
