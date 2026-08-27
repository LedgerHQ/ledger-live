import { useBalanceFilterSelectViewModel } from "../components/Filter/useBalanceFilterSelectViewModel";
import { usdcOption } from "./fixtures";

describe("useBalanceFilterSelectViewModel", () => {
  it("should fall back to the all-stablecoins label when nothing is selected", () => {
    const vm = useBalanceFilterSelectViewModel({
      allStablecoinsLabel: "All stablecoins",
      onOpenFilter: jest.fn(),
    });

    expect(vm.label).toBe("All stablecoins");
    expect(vm.ledgerId).toBeUndefined();
    expect(vm.ticker).toBeUndefined();
  });

  it("should expose the selected coin ticker and ledger id", () => {
    const vm = useBalanceFilterSelectViewModel({
      allStablecoinsLabel: "All stablecoins",
      selectedOption: usdcOption,
      onOpenFilter: jest.fn(),
    });

    expect(vm.label).toBe("USDC");
    expect(vm.ledgerId).toBe(usdcOption.ledgerId);
    expect(vm.ticker).toBe("USDC");
  });

  it("should forward the open handler", () => {
    const onOpenFilter = jest.fn();
    const vm = useBalanceFilterSelectViewModel({
      allStablecoinsLabel: "All stablecoins",
      onOpenFilter,
    });

    vm.onPress();

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });
});
