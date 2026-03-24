import { renderHook } from "@tests/test-renderer";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import { useListItemViewModel } from "../useListItemViewModel";
import { bitcoin, createCryptoAsset } from "./shared";

jest.mock("~/hooks/portfolio", () => ({
  ...jest.requireActual("~/hooks/portfolio"),
  usePortfolioForAccounts: jest.fn(),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: jest.fn(),
}));

const mockPortfolio = (percentage: number | null) => {
  (usePortfolioForAccounts as jest.Mock).mockReturnValue({
    countervalueChange: { percentage },
  });
};

const mockAsset = createCryptoAsset(bitcoin, 100_000);

describe("useListItemViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolio(null);
  });

  describe("delta", () => {
    it.each([
      { percentage: null, expectedText: "–", expectedColor: "muted" },
      { percentage: 0.035, expectedText: "+3.50%", expectedColor: "success" },
      { percentage: -0.012, expectedText: "-1.20%", expectedColor: "error" },
      { percentage: 0, expectedText: "0.00%", expectedColor: "muted" },
    ])(
      "should return $expectedText / $expectedColor for percentage=$percentage",
      ({ percentage, expectedText, expectedColor }) => {
        mockPortfolio(percentage);
        const { result } = renderHook(() => useListItemViewModel(mockAsset));

        expect(result.current.deltaText).toBe(expectedText);
        expect(result.current.deltaColor).toBe(expectedColor);
      },
    );
  });
});
