import React from "react";
import { Subject } from "rxjs";
import { act, render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import StepMandatoryPrivateSync from "./StepMandatoryPrivateSync";
import { makeStepProps } from "../../../__mocks__/stepProps.mock";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("~/renderer/actions/accounts", () => ({
  ...jest.requireActual("~/renderer/actions/accounts"),
  updateAccountWithUpdater: jest.fn().mockReturnValue({ type: "UPDATE_ACCOUNT" }),
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
});
