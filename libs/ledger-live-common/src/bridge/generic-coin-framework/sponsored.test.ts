import { findCryptoCurrencyByNetwork } from "./utils";
import { loadSponsoredApiForFamily } from "../../coin-modules/registry";
import { getSponsoredCoinApi } from "./sponsored";

jest.mock("./utils", () => ({ findCryptoCurrencyByNetwork: jest.fn() }));
jest.mock("../../coin-modules/registry", () => ({ loadSponsoredApiForFamily: jest.fn() }));

const mockFindCurrency = findCryptoCurrencyByNetwork as jest.Mock;
const mockLoadSponsoredApi = loadSponsoredApiForFamily as jest.Mock;

const seamApi = {
  listFeeOptions: jest.fn(),
  estimateSponsoredFeeQuote: jest.fn(),
  buildEnergyRentRequest: jest.fn(),
  craftEnergyRentTransaction: jest.fn(),
  submitEnergyRentPayment: jest.fn(),
  getEnergyRentStatus: jest.fn(),
  awaitEnergyDelivery: jest.fn(),
};

describe("getSponsoredCoinApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindCurrency.mockReturnValue({ id: "tron", family: "tron" });
    mockLoadSponsoredApi.mockResolvedValue(() => seamApi);
  });

  test("returns null for a non-local kind (sponsored sends resolve only via the local module)", async () => {
    expect(await getSponsoredCoinApi("tron", "js")).toBeNull();
    expect(mockLoadSponsoredApi).not.toHaveBeenCalled();
  });

  test("returns null when the network maps to no known currency", async () => {
    mockFindCurrency.mockReturnValue(undefined);
    expect(await getSponsoredCoinApi("not-a-network", "local")).toBeNull();
    expect(mockLoadSponsoredApi).not.toHaveBeenCalled();
  });

  test("returns null when the family registers no sponsored factory", async () => {
    mockFindCurrency.mockReturnValue({ id: "bitcoin", family: "bitcoin" });
    mockLoadSponsoredApi.mockResolvedValue(undefined);
    expect(await getSponsoredCoinApi("bitcoin", "local")).toBeNull();
    expect(mockLoadSponsoredApi).toHaveBeenCalledWith("bitcoin");
  });

  test("resolves the family's sponsored factory with the currency id", async () => {
    const seam = await getSponsoredCoinApi("tron", "local");
    expect(mockLoadSponsoredApi).toHaveBeenCalledWith("tron");
    expect(seam).toBe(seamApi);
    expect(typeof seam!.craftEnergyRentTransaction).toBe("function");
    expect(typeof seam!.estimateSponsoredFeeQuote).toBe("function");
  });
});
