import React from "react";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { StartExchangeIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { StartExchangeIntentComponent } from "./component";

describe("StartExchangeIntentComponent", () => {
  it.each([
    ["is not started", undefined],
    ["is starting", { type: "starting", deviceModelId: DeviceModelId.nanoX } as const],
    ["has the nonce, while the payload is fetched", { type: "nonce-ready", nonce: "n" } as const],
    ["failed", { type: "error", error: new Error("failed") } as const],
  ])(
    "shows a spinner while the start %s",
    (_name, jobState: StartExchangeIntentJobState | undefined) => {
      const { getByTestId } = render(
        <StartExchangeIntentComponent
          jobState={jobState}
          extraProps={undefined}
          onClose={jest.fn()}
        />,
      );

      expect(getByTestId("wallet-api-exchange-loading")).toBeTruthy();
    },
  );
});
