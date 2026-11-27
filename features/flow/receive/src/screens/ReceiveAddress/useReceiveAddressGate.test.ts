import { renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import type { ReceiveGateType } from "../../types";
import { useReceiveAddressGate } from "./useReceiveAddressGate";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const refreshGate = jest.fn();

function setup(
  gateType: ReceiveGateType | undefined,
  onResolveGate?: (refresh: () => void) => void,
  isVisible = true,
) {
  return renderHook(
    ({ visible }: { visible: boolean }) =>
      useReceiveAddressGate({
        gateType,
        isVisible: visible,
        copy: useReceiveAddressCopy({ assetTicker: "USDC", networkName: "Stellar" }),
        onResolveGate,
        refreshGate,
      }),
    { wrapper: receiveTestWrapper(), initialProps: { visible: isVisible } },
  );
}

describe("useReceiveAddressGate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows nothing when the account can receive", () => {
    const { result } = setup(undefined, jest.fn());

    expect(result.current).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("asks to add the token, and opens the family flow with its event", () => {
    const onResolveGate = jest.fn();
    const { result } = setup("activation", onResolveGate);

    expect(result.current).toMatchObject({
      type: "activation",
      title: "Add USDC to your account first",
      action: { label: "Add USDC" },
    });
    expect(trackPage).toHaveBeenCalledWith({
      category: "Receive - Activation Required",
      props: { page: "Receive - Confirmation", flow: "receive" },
    });

    result.current?.action?.onPress();
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "activate asset",
      page: "Receive - Confirmation",
      flow: "receive",
    });
    expect(onResolveGate).toHaveBeenCalledWith(refreshGate);
  });

  it("asks to onboard the account, without a button when the app has no flow for it", () => {
    const { result } = setup("onboarding");

    expect(result.current).toEqual({
      type: "onboarding",
      title: "Set up your account first",
      description:
        "Your account must be onboarded on the Stellar network before it can receive funds.",
      action: undefined,
    });
  });

  it("records the gate page only once nothing covers it, such as an incident", () => {
    const { rerender } = setup("activation", jest.fn(), false);
    expect(trackPage).not.toHaveBeenCalled();

    rerender({ visible: true });
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Receive - Activation Required" }),
    );
  });
});
