import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { track } from "~/renderer/analytics/segment";
import NotEnoughFundsToUnstake from "./index";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("~/renderer/screens/exchange/Swap2/utils", () => ({
  ...jest.requireActual("~/renderer/screens/exchange/Swap2/utils"),
  useGetSwapTrackingProperties: () => ({}),
}));

const account = genAccount("near-not-enough-funds", {
  currency: getCryptoCurrencyById("near"),
});

describe("NotEnoughFundsToUnstake", () => {
  beforeEach(() => jest.clearAllMocks());

  it("attributes its actions to the flow it is shown in", () => {
    render(
      <NotEnoughFundsToUnstake account={account} onClose={jest.fn()} page="WithdrawingFlowModal" />,
    );

    fireEvent.click(screen.getByText("Deposit"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked2",
      expect.objectContaining({ button: "receive", page: "WithdrawingFlowModal" }),
    );
  });

  it("keeps the undelegate flow as the default source page", () => {
    render(<NotEnoughFundsToUnstake account={account} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText("Deposit"));

    expect(track).toHaveBeenCalledWith(
      "button_clicked2",
      expect.objectContaining({ page: "UndelegateFlowModal" }),
    );
  });
});
