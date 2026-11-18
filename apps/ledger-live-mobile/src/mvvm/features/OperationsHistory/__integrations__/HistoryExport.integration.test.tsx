import React from "react";
import Share from "react-native-share";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { track } from "@shared/analytics";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const/navigation";
import OperationsList from "../screens/OperationsList";

const mockSetOptions = jest.fn();
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

const withAccounts = (state: State): State => ({
  ...state,
  accounts: { ...state.accounts, active: [BTC_ACCOUNT] },
});

function renderHistory(exportEnabled: boolean) {
  return render(
    <OperationsList
      route={
        {
          key: ScreenName.OperationsList,
          name: ScreenName.OperationsList,
          params: undefined,
        } as OperationsListProps["route"]
      }
      navigation={
        {
          setOptions: mockSetOptions,
          dispatch: jest.fn(),
        } as unknown as OperationsListProps["navigation"]
      }
    />,
    {
      overrideInitialState: withFlagOverrides(
        { lwmHistoryCsvExport: { enabled: exportEnabled } },
        withAccounts,
      ),
    },
  );
}

/** The ⋮ button lives in the navigation bar, which the screen hands to `setOptions`. */
function openOptionsMenu() {
  const { renderTrailing } = mockSetOptions.mock.calls.at(-1)[0].lumenNavBar;
  const trailing = renderTrailing({});
  act(() => trailing.props.onPress());
}

async function exportBitcoinAccount(user: ReturnType<typeof renderHistory>["user"]) {
  openOptionsMenu();
  await user.press(await screen.findByTestId("operations-history-export-csv"));
  await user.press(await screen.findByTestId(`history-export-account-${BTC_ACCOUNT.id}`));
  const confirm = screen.getByTestId("history-export-csv-confirm");
  await waitFor(() => expect(confirm.props.accessibilityState?.disabled).not.toBe(true));
  await user.press(confirm);
}

describe("History CSV export", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedShareOpen.mockResolvedValue({ success: true, message: "" });
  });

  it("does not offer the export when the feature flag is disabled", () => {
    renderHistory(false);

    expect(mockSetOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lumenNavBar: expect.objectContaining({ renderTrailing: undefined }),
      }),
    );
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
