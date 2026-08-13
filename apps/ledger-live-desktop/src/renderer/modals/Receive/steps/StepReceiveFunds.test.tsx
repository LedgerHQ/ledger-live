import React from "react";
import { Subject } from "rxjs";
import { render, waitFor, act } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import StepReceiveFunds from "./StepReceiveFunds";
import { StepProps } from "../Body";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

// Avoid the families registry lazy-loading (and suspending) real coin UIs.
jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: () => ({}),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);

const account = genAccount("step-receive-funds-account", { currency: undefined });

const makeDevice = (): Device =>
  ({
    deviceId: "device-1",
    modelId: "nanoX",
    wired: false,
  }) as Device;

const makeProps = (overrides: Partial<StepProps>): StepProps =>
  ({
    t: ((k: string) => k) as unknown as StepProps["t"],
    transitionTo: jest.fn(),
    device: makeDevice(),
    account,
    parentAccount: null,
    token: null,
    receiveTokenMode: false,
    closeModal: jest.fn(),
    isAddressVerified: null,
    verifyAddressError: null,
    onRetry: jest.fn(),
    onSkipConfirm: jest.fn(),
    onResetSkip: jest.fn(),
    onChangeToken: jest.fn(),
    onChangeAccount: jest.fn(),
    onChangeAddressVerified: jest.fn(),
    onClose: jest.fn(),
    currencyName: account.currency.name,
    ...overrides,
  }) as StepProps;

describe("StepReceiveFunds auto-trigger regression", () => {
  let receiveSubject: Subject<unknown>;
  let receive: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    receiveSubject = new Subject();
    receive = jest.fn(() => receiveSubject);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    mockedGetAccountBridge.mockReturnValue({ receive } as unknown as ReturnType<
      typeof getAccountBridge
    >);
  });

  it("should call bridge.receive only once when re-rendered with new callback/device identities while verification is pending", async () => {
    const { rerender } = render(<StepReceiveFunds {...makeProps({})} />);

    await waitFor(() => expect(receive).toHaveBeenCalledTimes(1));

    for (let i = 0; i < 3; i++) {
      rerender(
        <StepReceiveFunds
          {...makeProps({
            onChangeAddressVerified: jest.fn(),
            device: makeDevice(),
          })}
        />,
      );
      // let any pending effect/promise chain flush
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(receive).toHaveBeenCalledTimes(1);
  });

  it("should report success exactly once when the verification completes", async () => {
    const onChangeAddressVerified = jest.fn();
    render(<StepReceiveFunds {...makeProps({ onChangeAddressVerified })} />);

    await waitFor(() => expect(receive).toHaveBeenCalledTimes(1));

    await act(async () => {
      receiveSubject.next({ address: account.freshAddress });
      receiveSubject.complete();
      await Promise.resolve();
    });

    await waitFor(() => expect(onChangeAddressVerified).toHaveBeenCalledWith(true));
    expect(onChangeAddressVerified).not.toHaveBeenCalledWith(false, expect.anything());
    expect(onChangeAddressVerified).toHaveBeenCalledTimes(1);
  });
});
