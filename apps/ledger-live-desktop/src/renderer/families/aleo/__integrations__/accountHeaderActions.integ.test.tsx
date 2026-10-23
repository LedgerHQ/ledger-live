import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { importLLDCoinFamily } from "~/renderer/families";
import AccountHeaderActions from "~/renderer/screens/account/AccountHeaderActions";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    isAccountEmpty: () => false,
  }),
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));

jest.mock("~/renderer/screens/exchange/Swap2/utils/index", () => ({
  useGetSwapTrackingProperties: () => ({}),
}));

beforeEach(async () => {
  await importLLDCoinFamily("aleo");
});

const renderHeader = (families: string[]) =>
  render(<AccountHeaderActions account={ALEO_MAIN_ACCOUNT} parentAccount={undefined} />, {
    initialState: withFlagOverrides({
      newSendFlow: { enabled: true, params: { families, excludedCurrencyIds: [] } },
    }),
  });

describe("Aleo account header with the newSendFlow flag", () => {
  it("shows the Convert button when aleo is not in the new send flow", async () => {
    renderHeader(["bitcoin"]);

    await waitFor(() => expect(screen.getByTestId("self-transfer-button")).toBeVisible());
  });

  it("hides the Convert button when aleo is in the new send flow", async () => {
    renderHeader(["aleo"]);

    await waitFor(() => expect(screen.getByTestId("account-buttons-group")).toBeInTheDocument());
    expect(screen.queryByTestId("self-transfer-button")).not.toBeInTheDocument();
  });
});
