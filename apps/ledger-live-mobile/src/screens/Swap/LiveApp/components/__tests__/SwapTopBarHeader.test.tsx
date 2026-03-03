import React from "react";
import { render } from "@tests/test-renderer";
import { SwapTopBarHeader } from "../SwapTopBarHeader";
import { useSwapTopBarHeaderViewModel } from "../useSwapTopBarHeaderViewModel";

jest.mock("../useSwapTopBarHeaderViewModel", () => ({
  useSwapTopBarHeaderViewModel: jest.fn(),
}));

const mockedUseSwapTopBarHeaderViewModel = jest.mocked(useSwapTopBarHeaderViewModel);

describe("SwapTopBarHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger my ledger and swap history actions", async () => {
    const onMyLedgerPress = jest.fn();
    const onSwapHistoryPress = jest.fn();

    mockedUseSwapTopBarHeaderViewModel.mockReturnValue({
      onMyLedgerPress,
      onSwapHistoryPress,
    });

    const { user, getByTestId } = render(<SwapTopBarHeader />);

    await user.press(getByTestId("topbar-myledger"));
    await user.press(getByTestId("topbar-swap-history"));

    expect(onMyLedgerPress).toHaveBeenCalledTimes(1);
    expect(onSwapHistoryPress).toHaveBeenCalledTimes(1);
  });
});
