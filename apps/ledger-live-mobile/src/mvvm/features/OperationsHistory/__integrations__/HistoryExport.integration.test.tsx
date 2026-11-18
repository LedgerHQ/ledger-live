import React, { useMemo, useState } from "react";
import Share from "react-native-share";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { track } from "@shared/analytics";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const/navigation";
import type { LumenNativeStackNavigationOptions } from "LLM/components/Navigation";
import OperationsList from "../screens/OperationsList";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const mockedShareOpen = jest.mocked(Share.open);

const BTC_ACCOUNT = genAccount("history-export-integration-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 3,
});

type OperationsListProps = React.ComponentProps<typeof OperationsList>;
type NavigationOptions = Partial<LumenNativeStackNavigationOptions>;

const ROUTE = {
  key: ScreenName.OperationsList,
  name: ScreenName.OperationsList,
  params: undefined,
} as OperationsListProps["route"];

/** Renders the navigation bar trailing the screen hands to `setOptions`, where the ⋮ button lives. */
function OperationsListWithNavBar() {
  const [options, setOptions] = useState<NavigationOptions>({});
  const navigation = useMemo(
    () => ({ setOptions, dispatch: jest.fn() }) as unknown as OperationsListProps["navigation"],
    [],
  );

  return (
    <>
      {options.lumenNavBar?.renderTrailing?.({ canGoBack: true })}
      <OperationsList route={ROUTE} navigation={navigation} />
    </>
  );
}

const withAccounts = (state: State): State => ({
  ...state,
  accounts: { ...state.accounts, active: [BTC_ACCOUNT] },
});

function renderHistory(exportEnabled: boolean) {
  return render(<OperationsListWithNavBar />, {
    overrideInitialState: withFlagOverrides(
      { lwmHistoryCsvExport: { enabled: exportEnabled } },
      withAccounts,
    ),
  });
}

async function exportBitcoinAccount(user: ReturnType<typeof renderHistory>["user"]) {
  await user.press(screen.getByTestId("operations-history-options-trigger"));
  await user.press(await screen.findByText("Export transaction history"));
  await user.press(await screen.findByTestId(`history-export-account-${BTC_ACCOUNT.id}`));
  const confirm = screen.getByTestId("history-export-csv-confirm");
  await waitFor(() => expect(confirm).toBeEnabled());
  await user.press(confirm);
}

describe("History CSV export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedShareOpen.mockResolvedValue({ success: true, message: "" });
  });

  it("does not offer the export when the feature flag is disabled", () => {
    renderHistory(false);

    expect(screen.queryByTestId("operations-history-options-trigger")).toBeNull();
  });

  it("exports the selected account as a CSV file and shows the success", async () => {
    const { user } = renderHistory(true);

    await exportBitcoinAccount(user);

    expect(track).toHaveBeenCalledWith("ExportAccountOperations");
    expect(mockedShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "text/csv",
        url: expect.stringMatching(/^data:text\/csv;base64,/),
      }),
    );
    expect(await screen.findByText("Transaction history saved successfully")).toBeVisible();
  });

  it("shows the error when the share fails and lets the user try again", async () => {
    mockedShareOpen.mockRejectedValue(new Error("share failed"));
    const { user } = renderHistory(true);

    await exportBitcoinAccount(user);

    expect(await screen.findByText("Something went wrong")).toBeVisible();

    await user.press(screen.getByTestId("history-export-error-cta"));

    expect(await screen.findByTestId("history-export-dialog")).toBeVisible();
    expect(screen.queryByText("Something went wrong")).toBeNull();
  });
});
