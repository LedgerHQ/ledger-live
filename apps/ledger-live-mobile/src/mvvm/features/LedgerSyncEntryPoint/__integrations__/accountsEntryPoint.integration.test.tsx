import React from "react";
import { State } from "~/reducers/types";
import { renderWithReactQuery } from "@tests/test-renderer";
import { MockedAccounts } from "../../Accounts/__integrations__/mockedAccounts";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { EntryPoint } from "../types";
import { TestAccountsListScreen } from "./TestAccountsListScreen";

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
          postOnboarding: true,
        },
      },
      // lwmLedgerSyncOptimisation not defined = old behavior with "Activate Ledger Sync" text
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
    const { getByText, findByText, findByRole, user } = renderWithReactQuery(
      <TestAccountsListScreen entryPoint={EntryPoint.accounts} page="Accounts" />,
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
    const { queryByText } = renderWithReactQuery(
      <TestAccountsListScreen entryPoint={EntryPoint.accounts} page="Accounts" />,
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
                  postOnboarding: false,
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

const getInitialStateWithOptimisation = (state: State) => ({
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
          postOnboarding: true,
        },
      },
      lwmLedgerSyncOptimisation: {
        enabled: true,
      },
    },
    seenDevices: [
      {
        modelId: DeviceModelId.stax,
      } as DeviceModelInfo,
    ],
  },
});

describe("Ledger Sync Entry Point with lwmLedgerSyncOptimisation enabled", () => {
  it("accounts entry point should display optimised banner and open activation flow", async () => {
    const { getAllByText, findByRole, user } = renderWithReactQuery(
      <TestAccountsListScreen entryPoint={EntryPoint.accounts} page="Accounts" />,
      {
        overrideInitialState: getInitialStateWithOptimisation,
      },
    );

    await user.press(getAllByText(/your wallet isn't synced/i)[0]);

    expect(await findByRole("button", { name: "Continue" })).toBeVisible();
  });

  it("settings entry point should display optimised banner and open activation flow", async () => {
    const { getAllByText, findByRole, user } = renderWithReactQuery(
      <TestAccountsListScreen entryPoint={EntryPoint.settings} page="Settings" />,
      {
        overrideInitialState: getInitialStateWithOptimisation,
      },
    );

    await user.press(getAllByText(/your wallet isn't synced/i)[0]);

    expect(await findByRole("button", { name: "Continue" })).toBeVisible();
  });

  it("manager entry point should display optimised banner and open activation flow", async () => {
    const { getAllByText, findByRole, user } = renderWithReactQuery(
      <TestAccountsListScreen entryPoint={EntryPoint.manager} page="Manager" />,
      {
        overrideInitialState: getInitialStateWithOptimisation,
      },
    );

    await user.press(getAllByText(/your wallet isn't synced/i)[0]);

    expect(await findByRole("button", { name: "Continue" })).toBeVisible();
  });
});
