/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { createLocalCasperApi } from "./coinModuleApi";
import { createApi as createCasperApi } from "@ledgerhq/coin-casper/api";

jest.mock("@ledgerhq/coin-casper/api", () => ({
  createApi: jest.fn(),
}));

const mockCreateCasperApi = createCasperApi as jest.Mock;

describe("createLocalCasperApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to createApi and ignores the currencyId argument", () => {
    const api1 = { getBalance: jest.fn(), listOperations: jest.fn() };
    const api2 = { getBalance: jest.fn(), listOperations: jest.fn() };
    mockCreateCasperApi.mockReturnValueOnce(api1).mockReturnValueOnce(api2);

    expect(createLocalCasperApi("casper")).toBe(api1);
    expect(createLocalCasperApi("any-other-id")).toBe(api2);
    expect(mockCreateCasperApi.mock.calls).toEqual([[], []]);
  });
});
