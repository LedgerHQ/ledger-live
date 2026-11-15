/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import { act, renderHook } from "@testing-library/react";
import { ApplyUpdatesStateType } from "../types/ApplyUpdatesState";
import { CreateBackupStateType } from "../types/CreateBackupState";
import { OsUpdatesSteps } from "../types/OsUpdatesSteps";
import { PreChecksStateType } from "../types/PreChecksState";
import { RestoreBackupStateType } from "../types/RestoreBackupState";
import { type OsUpdatesOrchestratorUseCaseInput } from "../types/OsUpdatesOrchestrator";
import { type OsUpdatesProgress } from "../types/OsUpdatesProgress";
import { useOsUpdateSteps, type UseOsUpdateStepsInput } from "./useOsUpdateSteps";

const makeInput = (): OsUpdatesOrchestratorUseCaseInput => ({
  dmk: {} as OsUpdatesOrchestratorUseCaseInput["dmk"],
  connectedDevice: {
    sessionId: "session-1",
  } as OsUpdatesOrchestratorUseCaseInput["connectedDevice"],
  osUpdates: [],
  storage: {} as OsUpdatesOrchestratorUseCaseInput["storage"],
  onStop: jest.fn(),
});

let currentProgress: OsUpdatesProgress | null = null;
const mockProgress = (osUpdatesProgress: OsUpdatesProgress | null) => {
  currentProgress = osUpdatesProgress;
};

const preChecks: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.LOADING },
};
const updatesApplied: OsUpdatesProgress = {
  step: OsUpdatesSteps.APPLY_UPDATES,
  state: {
    type: ApplyUpdatesStateType.UPDATES_APPLIED,
    osVersion: "2.0.0",
    restoreResult: undefined,
  },
};

type Props = Omit<UseOsUpdateStepsInput, "osUpdatesProgress">;

const render = (props: Props = makeInput()) =>
  renderHook(
    (current: Props) => useOsUpdateSteps({ ...current, osUpdatesProgress: currentProgress }),
    { initialProps: props },
  );

describe("useOsUpdateSteps", () => {
  it("shows the pre-checks with a loading state before the first snapshot", () => {
    mockProgress(null);

    const { result } = render();

    expect(result.current.stepProps).toMatchObject(preChecks);
  });

  it.each([
    [{ step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } }],
    [{ step: OsUpdatesSteps.CREATE_BACKUP, state: { type: CreateBackupStateType.LOADING } }],
    [
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
      },
    ],
    [{ step: OsUpdatesSteps.RESTORE_BACKUP, state: { type: RestoreBackupStateType.LOADING } }],
  ] satisfies [OsUpdatesProgress][])("passes the current step and state (%o)", progress => {
    mockProgress(progress);

    const { result } = render();

    expect(result.current.stepProps).toMatchObject(progress);
  });

  it("passes the connected device to the step", () => {
    mockProgress(preChecks);

    const { result } = render();

    expect(result.current.stepProps.connectedDevice.sessionId).toBe("session-1");
  });

  describe("closing the workflow", () => {
    it("does not show the confirmation until the user asks to close", () => {
      mockProgress(preChecks);

      const { result } = render();

      expect(result.current.closeConfirmation.isOpen).toBe(false);
      expect(result.current.stepProps.isCloseConfirmationOpen).toBe(false);
    });

    it("asks for a confirmation instead of stopping when the user closes", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { result } = render(input);

      act(() => result.current.stepProps.onUserClose());

      expect(result.current.closeConfirmation.isOpen).toBe(true);
      expect(result.current.stepProps.isCloseConfirmationOpen).toBe(true);
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it("keeps the workflow going when the user continues", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { result } = render(input);
      act(() => result.current.stepProps.onUserClose());

      act(() => result.current.closeConfirmation.onContinue());

      expect(result.current.closeConfirmation.isOpen).toBe(false);
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it("stops the workflow when the user confirms the cancellation", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { result } = render(input);
      act(() => result.current.stepProps.onUserClose());

      act(() => result.current.closeConfirmation.onCancel());

      expect(input.onStop).toHaveBeenCalledTimes(1);
      expect(result.current.closeConfirmation.isOpen).toBe(false);
    });

    it("can ask again after the user chose to continue", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { result } = render(input);
      act(() => result.current.stepProps.onUserClose());
      act(() => result.current.closeConfirmation.onContinue());

      act(() => result.current.stepProps.onUserClose());

      expect(result.current.closeConfirmation.isOpen).toBe(true);
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it.each([
      ["updates applied", updatesApplied],
      [
        "backup restored",
        {
          step: OsUpdatesSteps.RESTORE_BACKUP,
          state: { type: RestoreBackupStateType.BACKUP_RESTORED, restoreResult: undefined },
        },
      ],
    ] satisfies [string, OsUpdatesProgress][])(
      "stops at once without a confirmation once the workflow has completed (%s)",
      (_label, progress) => {
        mockProgress(progress);
        const input = makeInput();
        const { result } = render(input);

        act(() => result.current.stepProps.onUserClose());

        expect(input.onStop).toHaveBeenCalledTimes(1);
        expect(result.current.closeConfirmation.isOpen).toBe(false);
      },
    );

    it("stops at once without a confirmation when confirmClose is false", () => {
      mockProgress(preChecks);
      const input = { ...makeInput(), confirmClose: false };
      const { result } = render(input);

      act(() => result.current.stepProps.onUserClose());

      expect(input.onStop).toHaveBeenCalledTimes(1);
      expect(result.current.closeConfirmation.isOpen).toBe(false);
      expect(result.current.stepProps.isCloseConfirmationOpen).toBe(false);
    });

    it("withdraws a confirmation that was open when the workflow completes", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { result, rerender } = render(input);
      act(() => result.current.stepProps.onUserClose());

      mockProgress(updatesApplied);
      rerender(input);

      expect(result.current.closeConfirmation.isOpen).toBe(false);
    });
  });

  describe("completion callback", () => {
    it("is not called before the workflow has completed", () => {
      mockProgress(preChecks);
      const onCompleted = jest.fn();

      render({ ...makeInput(), onCompleted });

      expect(onCompleted).not.toHaveBeenCalled();
    });

    it("is called when the updates are applied", () => {
      mockProgress(updatesApplied);
      const onCompleted = jest.fn();

      render({ ...makeInput(), onCompleted });

      expect(onCompleted).toHaveBeenCalledTimes(1);
    });

    it("is not called again when the caller passes a new callback after completion", () => {
      mockProgress(updatesApplied);
      const onCompleted = jest.fn();
      const nextOnCompleted = jest.fn();
      const input = makeInput();

      const { rerender } = render({ ...input, onCompleted });
      rerender({ ...input, onCompleted: nextOnCompleted });

      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(nextOnCompleted).not.toHaveBeenCalled();
    });

    it("calls the latest callback when the updates complete", () => {
      mockProgress(preChecks);
      const onCompleted = jest.fn();
      const nextOnCompleted = jest.fn();
      const input = makeInput();

      const { rerender } = render({ ...input, onCompleted });
      rerender({ ...input, onCompleted: nextOnCompleted });
      mockProgress(updatesApplied);
      rerender({ ...input, onCompleted: nextOnCompleted });

      expect(onCompleted).not.toHaveBeenCalled();
      expect(nextOnCompleted).toHaveBeenCalledTimes(1);
    });
  });
});
