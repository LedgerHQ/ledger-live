import React from "react";
import { render } from "@tests/test-renderer";
import {
  BOTTOM_INSET,
  getDeviceListPaddingChangeAfterPairing,
  getPairingFlowBottomInset,
} from "@tests/pairingFlowHost";
import MyWalletNavigator from "../Navigator";

const renderMyWallet = () => render(<MyWalletNavigator />);

describe("MyLedgerSection bottom inset", () => {
  it("should add the bottom inset while the pairing flow is shown", async () => {
    expect(await getPairingFlowBottomInset(renderMyWallet)).toBe(BOTTOM_INSET);
  });

  it("should give the device list its spacing back when the pairing flow is closed", async () => {
    expect(await getDeviceListPaddingChangeAfterPairing(renderMyWallet)).toBe(0);
  });
});
