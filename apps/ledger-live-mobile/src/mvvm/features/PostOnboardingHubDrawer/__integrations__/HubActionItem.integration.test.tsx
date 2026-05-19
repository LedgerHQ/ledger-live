import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  assetsTransferAction,
  discoverWalletAction,
  recoverAction,
  syncAccountsAction,
} from "~/logic/postOnboarding/actions";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";
import type { State } from "~/reducers/types";
import { HubActionItem } from "../components/HubActionItem";

const baseProps = (
  overrides: Partial<PostOnboardingActionRowProps> = {},
): PostOnboardingActionRowProps => ({
  ...assetsTransferAction,
  deviceModelId: DeviceModelId.nanoX,
  productName: "Nano X",
  completed: false,
  ...overrides,
});

function withLedgerSyncActive(state: State): State {
  return {
    ...state,
    trustchain: {
      ...state.trustchain,
      trustchain: {
        rootId: "rootId",
        applicationPath: "applicationPath",
        walletSyncEncryptionKey: "walletSyncEncryptionKey",
      },
    },
  };
}

describe("HubActionItem Integration", () => {
  it("should show the completed row when the action is already completed", async () => {
    render(<HubActionItem {...baseProps({ completed: true })} />);

    const actionRow = await screen.findByRole("button", { name: /assets transferred to ledger/i });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Complete")).toBeVisible();
    expect(screen.queryByText("Receive or buy crypto to fund your wallet")).toBeNull();
  });

  it("should show the completed row when the current app state fulfills the action", async () => {
    render(
      <HubActionItem
        {...baseProps({
          ...syncAccountsAction,
          completed: false,
        })}
      />,
      { overrideInitialState: withLedgerSyncActive },
    );

    const actionRow = await screen.findByRole("button", {
      name: /your accounts are synchronized/i,
    });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Complete")).toBeVisible();
  });

  it("should show the completed row when an async completion check succeeds", async () => {
    render(
      <HubActionItem
        {...baseProps({
          ...recoverAction,
          completed: false,
          getIsAlreadyCompleted: async () => true,
        })}
      />,
    );

    const actionRow = await screen.findByRole("button", { name: /backup secured/i });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Complete")).toBeVisible();
  });

  it("should show the pending discover wallet row when the tour is not completed", async () => {
    render(
      <HubActionItem
        {...baseProps({
          ...discoverWalletAction,
          completed: false,
          completionStatus: { isCompleted: false, isLoading: false },
        })}
      />,
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            productTourCompleted: false,
          },
        }),
      },
    );

    const actionRow = await screen.findByRole("button", {
      name: /discover your wallet/i,
    });

    expect(actionRow).not.toBeDisabled();
    expect(screen.getByText(/what.*new in your portfolio/i)).toBeVisible();
    expect(screen.queryByText("Complete")).toBeNull();
  });

  it("should show the completed row when the product tour is already completed", async () => {
    render(
      <HubActionItem
        {...baseProps({
          ...discoverWalletAction,
          completed: false,
        })}
      />,
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            productTourCompleted: true,
          },
        }),
      },
    );

    const actionRow = await screen.findByRole("button", {
      name: /wallet tour opened/i,
    });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Complete")).toBeVisible();
  });

  it("should keep the pending row disabled when the feature is disabled", async () => {
    render(
      <HubActionItem
        {...baseProps({
          ...syncAccountsAction,
          disabled: true,
        })}
      />,
    );

    const actionRow = await screen.findByRole("button", {
      name: /sync your wallet/i,
    });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Keep your crypto accounts synced")).toBeVisible();
  });
});
