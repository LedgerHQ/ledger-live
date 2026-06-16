import React from "react";
import BigNumber from "bignumber.js";
import { Subject } from "rxjs";
import { act, render, screen, waitFor } from "tests/testSetup";
import type { AleoAccount, AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../../../__mocks__/config.mock";
import { getAleoCurrencyConfig } from "../../../shared/utils";
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

jest.mock("../../../shared/utils", () => ({
  ...jest.requireActual("../../../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");
const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

describe("StepMandatoryPrivateSync", () => {
  let syncSubject: Subject<(acc: AleoAccount) => AleoAccount>;
  let mockSync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    syncSubject = new Subject();
    mockSync = jest.fn().mockReturnValue(syncSubject.asObservable());
    getAccountBridge.mockReturnValue({ sync: mockSync });
    mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);
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
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  it("should restart sync when retry button is clicked after error", async () => {
    const { user } = render(<StepMandatoryPrivateSync {...makeStepProps()} />);

    await act(async () => {
      syncSubject.error(new Error("Sync failed"));
    });

    expect(screen.getByText(/Private sync failed/)).toBeInTheDocument();

    // Prepare a new subject for the retry attempt
    syncSubject = new Subject();
    mockSync.mockReturnValue(syncSubject.asObservable());

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(mockSync).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Syncing your private balance/)).toBeInTheDocument();
  });

  it("should not call sync when account is not an AleoAccount", () => {
    // Plain account without aleoResources — isAleoAccount returns false
    const props = makeStepProps({ account: { ...ALEO_ACCOUNT_1 } });
    render(<StepMandatoryPrivateSync {...props} />);

    expect(mockSync).not.toHaveBeenCalled();
  });

  describe("transition when progress reaches 100%", () => {
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

    it("should call transitionTo('record-picker') after progress reaches 100 with manual strategy", async () => {
      const props = makeStepProps();
      render(<StepMandatoryPrivateSync {...props} />);
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) so syncSubject has a subscriber

      await act(async () => {
        syncSubject.next(() => makeAleoAccountAt100());
      });

      await waitFor(() => expect(props.transitionTo).toHaveBeenCalledWith("record-picker"), {
        timeout: 1000,
      });
    });

    it("should call transitionTo('amount') after progress reaches 100 with auto strategy", async () => {
      const autoConfig: AleoCoinConfig = { ...mockAleoCoinConfig, recordPickingStrategy: "auto" };
      mockGetAleoCurrencyConfig.mockReturnValue(autoConfig);

      const props = makeStepProps();
      render(<StepMandatoryPrivateSync {...props} />);
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) so syncSubject has a subscriber

      await act(async () => {
        syncSubject.next(() => makeAleoAccountAt100());
      });

      await waitFor(() => expect(props.transitionTo).toHaveBeenCalledWith("amount"), {
        timeout: 1000,
      });
    });

    it("should not call transitionTo if the component unmounts before the timer fires", async () => {
      const props = makeStepProps();
      const { unmount } = render(<StepMandatoryPrivateSync {...props} />);
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) so syncSubject has a subscriber

      await act(async () => {
        syncSubject.next(() => makeAleoAccountAt100());
      });

      unmount();

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(props.transitionTo).not.toHaveBeenCalled();
    });
  });

  describe("updateAccount callback", () => {
    it("should call updateAccount with the updated account on each sync emission", async () => {
      const props = makeStepProps();
      render(<StepMandatoryPrivateSync {...props} />);
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) so syncSubject has a subscriber

      await act(async () => {
        syncSubject.next(() => ({
          ...ALEO_ACCOUNT_1,
          aleoResources: {
            transparentBalance: new BigNumber(0),
            privateBalance: new BigNumber(0),
            unspentPrivateRecords: [],
            provableApi: { scannerStatus: { synced: false, percentage: 50 } },
            lastPrivateSyncDate: null,
          },
        }));
      });

      expect(props.updateAccount).toHaveBeenCalledTimes(1);
      const updatedAccount = (props.updateAccount as jest.Mock).mock.calls[0][0];
      expect(updatedAccount.aleoResources.provableApi.scannerStatus.percentage).toBe(50);
    });

    it("should not throw when updateAccount is not provided", async () => {
      const props = makeStepProps({ updateAccount: undefined });
      render(<StepMandatoryPrivateSync {...props} />);
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) so syncSubject has a subscriber

      await act(async () => {
        syncSubject.next(() => ({
          ...ALEO_ACCOUNT_1,
          aleoResources: {
            transparentBalance: new BigNumber(0),
            privateBalance: new BigNumber(0),
            unspentPrivateRecords: [],
            provableApi: { scannerStatus: { synced: false, percentage: 30 } },
            lastPrivateSyncDate: null,
          },
        }));
      });

      // No crash — updateAccount being optional is handled gracefully
      expect(screen.getByText(/Syncing your private balance/)).toBeInTheDocument();
    });
  });
});
