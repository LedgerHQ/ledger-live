import type { InternetComputerOperation } from "@ledgerhq/live-common/families/internet_computer/types";
import { render, waitFor } from "@tests/test-renderer";
import React from "react";
import { ScreenName } from "~/const";
import ICPConnectDevice from "../components/ConnectDevice";
import { makeICPAccount, makeOperation } from "./testUtils";

const makeError = (name: string) => Object.assign(new Error(name), { name });

// The optimistic operation the device handed back. `methodName` is what marks it a stake, and it is
// set by buildOptimisticOperation for every non-send transaction.
const SIGNED_OP = makeOperation({ methodName: "create_neuron" });

let broadcastResult: () => Promise<InternetComputerOperation>;
const applyNeuronOperation = jest.fn();
const mockReplace = jest.fn();

jest.mock("../common", () => ({
  applyNeuronOperation: (...args: unknown[]) => applyNeuronOperation(...args),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => () => broadcastResult(),
}));
jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: makeICPAccount(), parentAccount: null }),
}));
jest.mock("~/hooks/deviceActions", () => ({ useTransactionDeviceAction: () => ({}) }));
jest.mock("~/datadog", () => ({ broadcastLogger: {} }));
jest.mock("~/logger", () => ({ __esModule: true, default: { critical: jest.fn() } }));

// Stands in for the real one, which starts talking to a device on mount. Invoking `renderOnResult`
// during render is what DeviceAction itself does once a signature is in hand.
jest.mock("~/components/DeviceAction", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ renderOnResult }: { renderOnResult?: (payload: unknown) => React.ReactNode }) => {
      renderOnResult?.({ signedOperation: { operation: SIGNED_OP } });
      return React.createElement(View, { testID: "device-action" });
    },
  };
});

const renderScreen = () =>
  render(
    <ICPConnectDevice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation={{ replace: mockReplace } as any}
      route={
        {
          name: ScreenName.InternetComputerStakingConnectDevice,
          params: {
            accountId: "icp-1",
            transaction: { family: "internet_computer", type: "create_neuron" },
            device: { deviceId: "device-1" },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any
      }
      category="Staking ICP Flow"
    />,
  );

/*
 * A broadcast that throws skips the fold entirely, so nothing records that the device signed at all.
 * For a stake that is wrong whenever the ICP may have moved — a transfer the node took without
 * certifying, or one that settled and was then not claimed: the account reads as never having
 * staked, which is what puts "Stake ICP" back in front of a user whose ICP may already be in a
 * neuron's account.
 */
describe("ICP signing screen, broadcast failures", () => {
  beforeEach(() => {
    applyNeuronOperation.mockClear();
    mockReplace.mockClear();
  });

  it.each(["ICPCallUnconfirmed", "ICPStakeNotRefreshed"])(
    "records a stake whose ICP may have moved, on %s, so the account does not read as untouched",
    async name => {
      broadcastResult = () => Promise.reject(makeError(name));

      renderScreen();

      await waitFor(() => expect(applyNeuronOperation).toHaveBeenCalled());
      const [, , operation, transaction] = applyNeuronOperation.mock.calls[0];
      expect(operation).toBe(SIGNED_OP);
      // Without the transaction: a replay would put on the snapshot what the canister did not do.
      expect(transaction).toBeUndefined();
    },
  );

  // The ledger refusing the transfer arrives as a plain Error, and nothing has moved. Nothing that
  // leaves the ICP's whereabouts open reaches here as one: the coin module reports it as
  // ICPStakeNotRefreshed or ICPCallUnconfirmed (broadcast.ts).
  it("records nothing when the ledger refused the transfer", async () => {
    broadcastResult = () => Promise.reject(new Error('{"InsufficientFunds":{"balance":"0"}}'));

    renderScreen();

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(applyNeuronOperation).not.toHaveBeenCalled();
  });

  it("still routes a failure to the error screen with the signature recorded", async () => {
    broadcastResult = () => Promise.reject(makeError("ICPCallUnconfirmed"));

    renderScreen();

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const [screen, params] = mockReplace.mock.calls[0];
    expect(screen).toContain("ValidationError");
    expect(params).toMatchObject({ signed: true });
  });
});
