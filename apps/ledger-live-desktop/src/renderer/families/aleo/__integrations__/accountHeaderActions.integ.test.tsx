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

describe("Aleo account header", () => {
  it("does not offer Convert when aleo is not in the new send flow", async () => {
    render(<AccountHeaderActions account={ALEO_MAIN_ACCOUNT} parentAccount={undefined} />, {
      initialState: withFlagOverrides({
        newSendFlow: { enabled: true, params: { families: ["bitcoin"], excludedCurrencyIds: [] } },
      }),
    });

    await waitFor(() => expect(screen.getByTestId("account-buttons-group")).toBeInTheDocument());
    expect(screen.queryByTestId("self-transfer-button")).not.toBeInTheDocument();
  });
});
