import { getCoinModuleApi } from "./api";
import { getSponsoredCoinApi } from "./sponsored";

jest.mock("./api", () => ({
  getCoinModuleApi: jest.fn(),
}));

describe("getSponsoredCoinApi", () => {
  test("returns null when the module lacks the seam methods", async () => {
    (getCoinModuleApi as jest.Mock).mockResolvedValue({ broadcast: jest.fn() });
    expect(await getSponsoredCoinApi("bitcoin", "js")).toBeNull();
  });

  test("returns the narrowed api when all seam methods are present", async () => {
    const full = {
      listFeeOptions: jest.fn(),
      estimateSponsoredFeeQuote: jest.fn(),
      buildEnergyRentRequest: jest.fn(),
      craftEnergyRentTransaction: jest.fn(),
      submitEnergyRentPayment: jest.fn(),
      getEnergyRentStatus: jest.fn(),
      awaitEnergyDelivery: jest.fn(),
    };
    (getCoinModuleApi as jest.Mock).mockResolvedValue(full);
    const seam = await getSponsoredCoinApi("tron", "js");
    expect(seam).not.toBeNull();
    expect(typeof seam!.craftEnergyRentTransaction).toBe("function");
    expect(typeof seam!.estimateSponsoredFeeQuote).toBe("function");
  });

  test("returns null when the fee-quote method is missing (partial seam)", async () => {
    const partial = {
      listFeeOptions: jest.fn(),
      craftEnergyRentTransaction: jest.fn(),
      submitEnergyRentPayment: jest.fn(),
      getEnergyRentStatus: jest.fn(),
      awaitEnergyDelivery: jest.fn(),
    };
    (getCoinModuleApi as jest.Mock).mockResolvedValue(partial);
    expect(await getSponsoredCoinApi("tron", "js")).toBeNull();
  });
});
