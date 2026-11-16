import React from "react";
import { BackHandler } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { HyperliquidSignIntentJobState } from "@features/platform-intent-hyperliquid-sign";
import { HyperliquidSignIntentComponentLWM } from "../componentLWM";

const SIGNING: HyperliquidSignIntentJobState = {
  type: "signing",
  deviceModelId: DeviceModelId.FLEX,
  deviceName: "My Flex",
};

function renderComponent(jobState: HyperliquidSignIntentJobState | undefined) {
  return render(
    <HyperliquidSignIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={jest.fn()}
    />,
  );
}

describe("HyperliquidSignIntentComponentLWM", () => {
  it("should render nothing before the job emits a state", () => {
    renderComponent(undefined);

    expect(screen.queryByTestId("perps-sign-intent-signing")).toBeNull();
  });

  it("should ask the user to continue on their device while signing", () => {
    renderComponent(SIGNING);

    expect(screen.getByText("Continue on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText(/Follow the instructions displayed on your Secure.Screen/),
    ).toBeVisible();
    expect(screen.getByText("My Flex")).toBeVisible();
  });

  it("should lock the modal and block native back only while signing", () => {
    const removeBackListener = jest.fn();
    const addListenerSpy = jest
      .spyOn(BackHandler, "addEventListener")
      .mockReturnValue({ remove: removeBackListener });

    const { store, rerender } = renderComponent(SIGNING);

    expect(store.getState().appstate.modalLock).toBe(true);
    expect(addListenerSpy).toHaveBeenCalledWith("hardwareBackPress", expect.any(Function));
    expect(removeBackListener).not.toHaveBeenCalled();

    rerender(
      <HyperliquidSignIntentComponentLWM
        jobState={{ type: "refused" }}
        extraProps={undefined}
        onClose={jest.fn()}
      />,
    );

    expect(store.getState().appstate.modalLock).toBe(false);
    expect(removeBackListener).toHaveBeenCalledTimes(1);

    addListenerSpy.mockRestore();
  });

  it.each<HyperliquidSignIntentJobState>([
    { type: "signed" },
    { type: "refused" },
    { type: "error", error: new Error("certificate not found") },
  ])("should leave the $type outcome to the live app while the drawer closes", jobState => {
    renderComponent(jobState);

    expect(screen.getByTestId("perps-sign-intent-done")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
