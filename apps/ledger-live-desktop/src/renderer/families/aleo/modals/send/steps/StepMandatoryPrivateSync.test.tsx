import React from "react";
import BigNumber from "bignumber.js";
import { Subject } from "rxjs";
import { act, render, screen, waitFor } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import StepMandatoryPrivateSync from "./StepMandatoryPrivateSync";
import { makeStepProps } from "../../../__mocks__/stepProps.mock";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("~/renderer/actions/accounts", () => ({
  ...jest.requireActual("~/renderer/actions/accounts"),
  updateAccountWithUpdater: jest
    .fn()
    .mockImplementation((accountId: string, updater: (a: unknown) => unknown) => ({
      type: "UPDATE_ACCOUNT",
      payload: { accountId, updater },
    })),
}));

const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");

describe("StepMandatoryPrivateSync", () => {
  let syncSubject: Subject<(acc: AleoAccount) => AleoAccount>;
  let mockSync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    syncSubject = new Subject();
    mockSync = jest.fn().mockReturnValue(syncSubject.asObservable());
    getAccountBridge.mockReturnValue({ sync: mockSync });
  });

  afterEach(() => {
    syncSubject.complete();
    jest.useRealTimers();
  });

  it("should render spinner and title while syncing", () => {
    render(<StepMandatoryPrivateSync {...makeStepProps()} />);

    expect(screen.getByText(/Syncing your private balance \(0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Please wait/)).toBeInTheDocument();
  });

  it("should show error state when sync fails", async () => {
    render(<StepMandatoryPrivateSync {...makeStepProps()} />);

    await act(async () => {
      syncSubject.error(new Error("Sync failed"));
    });

    expect(screen.getByText(/Private sync failed/)).toBeInTheDocument();
  });

  it("should not call sync when account is not an AleoAccount", () => {
    // Plain account without aleoResources — isAleoAccount returns false
    const props = makeStepProps({ account: { ...ALEO_ACCOUNT_1 } });
    render(<StepMandatoryPrivateSync {...props} />);

    expect(mockSync).not.toHaveBeenCalled();
  });

  describe("transition to record-picker when progress reaches 100%", () => {
    const makeAleoAccountAt100 = (): AleoAccount => ({
      ...ALEO_ACCOUNT_1,
      aleoResources: {
        transparentBalance: new BigNumber(0),
        privateBalance: new BigNumber(0),
        unspentPrivateRecords: [],
        provableApi: { scannerStatus: { synced: true, percentage: 100 } },
        lastPrivateSyncDate: null,
      },
    });

    it("should call transitionTo('record-picker') after progress reaches 100", async () => {
      const props = makeStepProps();
      render(<StepMandatoryPrivateSync {...props} />);

      await act(async () => {
        syncSubject.next(() => makeAleoAccountAt100());
      });

      await waitFor(() => expect(props.transitionTo).toHaveBeenCalledWith("record-picker"), {
        timeout: 1000,
      });
    });

    it("should not call transitionTo if the component unmounts before the timer fires", async () => {
      const props = makeStepProps();
      const { unmount } = render(<StepMandatoryPrivateSync {...props} />);

      await act(async () => {
        syncSubject.next(() => makeAleoAccountAt100());
      });

      unmount();

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(props.transitionTo).not.toHaveBeenCalled();
    });
  });
});
