import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { buyCryptoAction, recoverAction, syncAccountsAction } from "~/logic/postOnboarding/actions";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";
import type { State } from "~/reducers/types";
import { HubActionItem } from "../components/HubActionItem";

const baseProps = (
  overrides: Partial<PostOnboardingActionRowProps> = {},
): PostOnboardingActionRowProps => ({
  ...buyCryptoAction,
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

    const actionRow = await screen.findByRole("button", { name: /crypto bought/i });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Complete")).toBeVisible();
    expect(screen.queryByText("Choose from 500+ coins and tokens.")).toBeNull();
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

  it("should keep the pending row disabled when the feature is disabled", async () => {
    render(<HubActionItem {...baseProps({ disabled: true })} />);

    const actionRow = await screen.findByRole("button", {
      name: /buy crypto via ledger wallet/i,
    });

    expect(actionRow).toBeDisabled();
    expect(screen.getByText("Choose from 500+ coins and tokens.")).toBeVisible();
  });
});
