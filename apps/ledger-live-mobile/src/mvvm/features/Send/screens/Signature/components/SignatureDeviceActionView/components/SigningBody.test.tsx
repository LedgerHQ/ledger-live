import React from "react";
import { render, screen as rtlScreen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { SigningBody } from "./SigningBody";

const trackScreen = jest.fn();

jest.mock("~/analytics", () => ({
  screen: (...args: unknown[]) => trackScreen(...args),
}));

const device: Device = {
  deviceId: "device-1",
  modelId: DeviceModelId.europa,
  wired: false,
};

const trackingProperties = {
  flow: "send",
  newSendFlow: true,
  blockchain: "Ethereum",
  currency: "ETH",
  currency_id: "ethereum",
} as const;

type SigningBodyPropsForTest = React.ComponentProps<typeof SigningBody>;

function renderSigningBody(status: Record<string, unknown>) {
  const action = {
    useHook: () => status,
    mapResult: () => null,
  } as unknown as SigningBodyPropsForTest["action"];

  // Rendered with no SendFlowProvider / SendFlowTrackingProvider on purpose: in the app this
  // component lives inside the bottom-sheet portal, which mounts outside the send-flow tree.
  return render(
    <SigningBody
      device={device}
      action={action}
      request={{} as SigningBodyPropsForTest["request"]}
      onResult={jest.fn()}
      onClose={jest.fn()}
      trackingProperties={trackingProperties}
      recipientType="contact"
    />,
  );
}

describe("SigningBody", () => {
  beforeEach(() => {
    trackScreen.mockClear();
  });

  it("renders without the send-flow providers in the tree", () => {
    expect(() => renderSigningBody({ deviceSignatureRequested: false })).not.toThrow();
    expect(rtlScreen.getByTestId("send-signature-loading")).toBeVisible();
  });

  it("tracks a device refusal from the props instead of the send-flow context", () => {
    renderSigningBody({
      deviceSignatureRequested: false,
      transactionSignError: { name: "UserRefusedOnDevice" },
    });

    expect(trackScreen).toHaveBeenCalledWith("Modal send - action rejected", undefined, {
      ...trackingProperties,
      recipientType: "contact",
    });
  });
});
