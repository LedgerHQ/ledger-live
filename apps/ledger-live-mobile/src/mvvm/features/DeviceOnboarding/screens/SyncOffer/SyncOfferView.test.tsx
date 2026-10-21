import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SyncOfferScreen } from "./index";

function QueuedBottomSheetMock({
  isRequestingToBeOpened,
  onClose,
  children,
}: {
  isRequestingToBeOpened?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}) {
  const { Pressable, Text, View } = jest.requireActual("react-native");

  if (!isRequestingToBeOpened) return null;

  return (
    <View>
      {onClose ? (
        <Pressable testID="modal-close-button" onPress={onClose}>
          <Text>Close drawer</Text>
        </Pressable>
      ) : null}
      {children}
    </View>
  );
}

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: () => null,
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: QueuedBottomSheetMock,
}));

function renderSyncOffer() {
  const onActivate = jest.fn();
  const onSkip = jest.fn();
  const onLearnMore = jest.fn();
  const onQuit = jest.fn();

  return {
    ...render(
      <SyncOfferScreen
        onActivate={onActivate}
        onSkip={onSkip}
        onLearnMore={onLearnMore}
        onQuit={onQuit}
      />,
    ),
    onActivate,
    onSkip,
    onLearnMore,
    onQuit,
  };
}

describe("SyncOfferView", () => {
  it("should activate synchronisation from the primary action", async () => {
    const { user, onActivate, onSkip } = renderSyncOffer();

    expect(screen.getByText("Sync your wallet")).toBeVisible();
    expect(
      screen.getByText(
        /Keep your balance and portfolio in sync when switching phones or using a computer\./,
      ),
    ).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Activate" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should open the skip drawer without leaving the offer", async () => {
    const { user, onSkip, onActivate, onQuit } = renderSyncOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));

    expect(screen.getByText("Sync your wallet")).toBeVisible();
    expect(screen.getByText("Are you sure?")).toBeVisible();
    expect(onSkip).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should confirm the skip from the drawer", async () => {
    const { user, onSkip, onActivate } = renderSyncOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));
    await user.press(screen.getByRole("button", { name: "Yes skip" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("should activate synchronisation from the skip drawer", async () => {
    const { user, onSkip, onActivate } = renderSyncOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));
    await user.press(screen.getByRole("button", { name: "No, enable sync" }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSkip).not.toHaveBeenCalled();
  });

  it("should close the skip drawer without leaving the offer", async () => {
    const { user, onSkip, onQuit } = renderSyncOffer();

    await user.press(screen.getByRole("button", { name: "Skip for now" }));
    await user.press(screen.getByTestId("modal-close-button"));

    expect(screen.queryByText("Are you sure?")).toBeNull();
    expect(onSkip).not.toHaveBeenCalled();
    expect(onQuit).not.toHaveBeenCalled();
  });

  it("should open learn more and leave from the header", async () => {
    const { user, onLearnMore, onQuit, onActivate } = renderSyncOffer();

    await user.press(screen.getByRole("link", { name: "Learn more" }));
    await user.press(screen.getByRole("button", { name: "Close" }));

    expect(onLearnMore).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onActivate).not.toHaveBeenCalled();
  });
});
