import { selectCurrency } from "../currencySelection";
import { mockAssetsDataWithPagination } from "../../__mocks__/assets.mock";

describe("currencySelection", () => {
  it("should return the correct currency", () => {
    const result = selectCurrency(mockAssetsDataWithPagination);
    expect(result).toBeDefined();

    expect(result).toMatchObject({
      type: "CryptoCurrency",
      id: "injective",
      name: "Injective",
      ticker: "INJ",
    });
  });
});
