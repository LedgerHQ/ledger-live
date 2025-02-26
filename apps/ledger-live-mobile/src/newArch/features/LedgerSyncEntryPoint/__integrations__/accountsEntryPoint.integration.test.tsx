import React from "react";
import { State } from "~/reducers/types";
import { renderWithReactQuery } from "@tests/test-renderer";
import { MockedAccounts } from "../../Accounts/__integrations__/mockedAccounts";
import AccountsList from "../../Accounts/screens/AccountsList";
import { AccountsListNavigator } from "../../Accounts/screens/AccountsList/types";
import { ScreenName } from "~/const";
import { createStackNavigator } from "@react-navigation/stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { EntryPoint } from "../types";
import LedgerSyncEntryPoint from "..";

const getInitialState = (state: State) => ({
  ...state,
  accounts: MockedAccounts,
  settings: {
    ...state.settings,
    readOnlyModeEnabled: false,
    overriddenFeatureFlags: {
      llmAccountListUI: {
        enabled: true,
      },
      llmWalletSync: {
        enabled: true,
        params: {
          environment: "STAGING",
          watchConfig: {},
        },
      },
      llmLedgerSyncEntryPoints: {
        enabled: true,
        params: {
          manager: false,
          accounts: true,
          settings: true,
        },
      },
    },
    seenDevices: [
      {
        modelId: DeviceModelId.stax,
      } as DeviceModelInfo,
    ],
  },
});

describe("Ledger Sync Entry Point on Accounts screen", () => {
  it("entry point should be displayed and open ledger sync activation flow", async () => {
    const Stack = createStackNavigator<AccountsListNavigator>();

    const { getByText, findByText, findByRole, user } = renderWithReactQuery(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          initialParams={{ sourceScreenName: ScreenName.AccountsList, canAddAccount: true }}
          options={{
            headerTitle: "",
            headerRight: () => (
              <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} page="Accounts" />
            ),
          }}
        />
      </Stack.Navigator>,
      {
        overrideInitialState: getInitialState,
      },
    );

    await user.press(getByText(/activate ledger sync/i));

    // Check if the activation screen is visible
    expect(await findByText(/Turn on Ledger Sync for this phone?/i)).toBeVisible();
    expect(await findByRole("button", { name: "Turn on Ledger Sync" })).toBeVisible();
  });

  it("entry point should not be displayed when the entry point is disabled in the ff", async () => {
    const Stack = createStackNavigator<AccountsListNavigator>();

    const { queryByText } = renderWithReactQuery(
      <Stack.Navigator>
        <Stack.Screen
          name={ScreenName.AccountsList}
          component={AccountsList}
          initialParams={{ sourceScreenName: ScreenName.AccountsList, canAddAccount: true }}
          options={{
            headerTitle: "",
            headerRight: () => (
              <LedgerSyncEntryPoint entryPoint={EntryPoint.accounts} page="Accounts" />
            ),
          }}
        />
      </Stack.Navigator>,
      {
        overrideInitialState: (state: State) => ({
          ...getInitialState(state),
          settings: {
            ...state.settings,
            overriddenFeatureFlags: {
              ...state.settings.overriddenFeatureFlags,
              llmLedgerSyncEntryPoints: {
                enabled: true,
                params: {
                  manager: false,
                  accounts: false,
                  settings: true,
                },
              },
            },
          },
        }),
      },
    );

    // Check that the entry point is not visible
    expect(queryByText(/activate ledger sync/i)).not.toBeVisible();
  });
});
