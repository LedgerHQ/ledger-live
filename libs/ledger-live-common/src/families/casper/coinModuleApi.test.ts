import { createLocalCasperApi } from "./coinModuleApi";

const mockApi = {
  getBalance: jest.fn(),
  listOperations: jest.fn(),
};

jest.mock("@ledgerhq/coin-casper/api", () => ({
  createApi: () => mockApi,
}));

describe("createLocalCasperApi", () => {
  it("delegates to createApi and ignores the currencyId argument", () => {
    const api1 = createLocalCasperApi("casper");
    const api2 = createLocalCasperApi("any-other-id");

    expect(api1).toBe(mockApi);
    expect(api2).toBe(mockApi);
  });
});
