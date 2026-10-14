/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import React, { useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  ApplyUpdatesStateType,
  CreateBackupStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { useOsUpdatesOrchestrator } from "../hooks/useOsUpdatesOrchestrator";
import type { OsUpdatePlatformComponents } from "../types";
import { OsUpdatesOrchestratorComponent } from "./OsUpdatesOrchestratorComponent";

jest.mock("../hooks/useOsUpdatesOrchestrator");

const platformComponents: OsUpdatePlatformComponents = {
  PreChecksComponent: ({ step, state, connectedDevice, onUserClose, isCloseConfirmationOpen }) => (
    <button
      data-testid="pre-checks"
      data-step={step}
      data-session={connectedDevice.sessionId}
      data-confirmation-open={String(isCloseConfirmationOpen)}
      onClick={onUserClose}
    >
      {state.type}
    </button>
  ),
  CreateBackupComponent: ({ state }) => <div data-testid="create-backup">{state.type}</div>,
  ApplyUpdatesComponent: ({ step, state, onUserClose, isCloseConfirmationOpen }) => (
    <button
      data-testid="apply-updates"
      data-step={step}
      data-confirmation-open={String(isCloseConfirmationOpen)}
      onClick={onUserClose}
    >
      {state.type}
    </button>
  ),
  RestoreBackupComponent: ({ state, onUserClose }) => (
    <button data-testid="restore-backup" onClick={onUserClose}>
      {state.type}
    </button>
  ),
  CloseConfirmationComponent: ({ isOpen, onContinue, onCancel }) =>
    isOpen ? (
      <div data-testid="close-confirmation">
        <button data-testid="continue" onClick={onContinue}>
          continue
        </button>
        <button data-testid="cancel" onClick={onCancel}>
          cancel
        </button>
      </div>
    ) : null,
};

const makeInput = (): OsUpdatesOrchestratorUseCaseInput => ({
  dmk: {} as OsUpdatesOrchestratorUseCaseInput["dmk"],
  connectedDevice: {
    sessionId: "session-1",
  } as OsUpdatesOrchestratorUseCaseInput["connectedDevice"],
  osUpdates: [],
  storage: {} as OsUpdatesOrchestratorUseCaseInput["storage"],
  onStop: jest.fn(),
});

const mockProgress = (osUpdatesProgress: OsUpdatesProgress | null) =>
  jest.mocked(useOsUpdatesOrchestrator).mockReturnValue({ osUpdatesProgress });

describe("OsUpdatesOrchestratorComponent", () => {
  it("renders the pre-checks with a loading state before the first snapshot", () => {
    mockProgress(null);

    render(
      <OsUpdatesOrchestratorComponent {...makeInput()} platformComponents={platformComponents} />,
    );

    const preChecks = screen.getByTestId("pre-checks");
    expect(preChecks.textContent).toBe("LOADING");
    expect(preChecks.getAttribute("data-step")).toBe(OsUpdatesSteps.PRE_CHECKS);
  });

  it.each([
    [
      "pre-checks",
      { step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } },
      "LOADING",
    ],
    [
      "create-backup",
      { step: OsUpdatesSteps.CREATE_BACKUP, state: { type: CreateBackupStateType.LOADING } },
      "LOADING",
    ],
    [
      "apply-updates",
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
      },
      "AWAITING_UPDATE_COMPLETE",
    ],
    [
      "restore-backup",
      {
        step: OsUpdatesSteps.RESTORE_BACKUP,
        state: { type: RestoreBackupStateType.LOADING },
      },
      "LOADING",
    ],
  ] satisfies [string, OsUpdatesProgress, string][])(
    "renders the %s platform component with the current state",
    (testId, progress, stateType) => {
      mockProgress(progress);

      render(
        <OsUpdatesOrchestratorComponent {...makeInput()} platformComponents={platformComponents} />,
      );

      expect(screen.getByTestId(testId).textContent).toBe(stateType);
    },
  );

  it("passes the connected device to the platform component", () => {
    mockProgress({ step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } });

    render(
      <OsUpdatesOrchestratorComponent {...makeInput()} platformComponents={platformComponents} />,
    );

    expect(screen.getByTestId("pre-checks").dataset.session).toBe("session-1");
  });

  it.each([
    ["pre-checks", OsUpdatesSteps.PRE_CHECKS, { type: PreChecksStateType.LOADING }],
    [
      "apply-updates",
      OsUpdatesSteps.APPLY_UPDATES,
      { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
    ],
  ] as const)("tells the %s component which step it renders", (testId, step, state) => {
    mockProgress({ step, state } as OsUpdatesProgress);

    render(
      <OsUpdatesOrchestratorComponent {...makeInput()} platformComponents={platformComponents} />,
    );

    expect(screen.getByTestId(testId).dataset.step).toBe(step);
  });

  describe("moving from a step to the next", () => {
    const steps: OsUpdatesProgress[] = [
      { step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } },
      { step: OsUpdatesSteps.CREATE_BACKUP, state: { type: CreateBackupStateType.LOADING } },
      {
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
      },
    ];

    const countMounts = (components: OsUpdatePlatformComponents, mounted: { count: number }) => {
      const input = makeInput();
      mockProgress(steps[0]);
      const { rerender } = render(
        <OsUpdatesOrchestratorComponent {...input} platformComponents={components} />,
      );
      for (const next of steps.slice(1)) {
        mockProgress(next);
        rerender(<OsUpdatesOrchestratorComponent {...input} platformComponents={components} />);
      }
      return mounted.count;
    };

    it("keeps a single instance mounted when the same component is injected for the steps", () => {
      const mounted = { count: 0 };
      const Shared = ({ step }: { step: string }) => {
        useEffect(() => {
          mounted.count += 1;
        }, []);
        return <div data-testid="shared">{step}</div>;
      };

      const count = countMounts(
        {
          ...platformComponents,
          PreChecksComponent: Shared,
          CreateBackupComponent: Shared,
          ApplyUpdatesComponent: Shared,
          RestoreBackupComponent: Shared,
        },
        mounted,
      );

      expect(count).toBe(1);
      expect(screen.getByTestId("shared").textContent).toBe(OsUpdatesSteps.APPLY_UPDATES);
    });

    it("mounts a new instance per step when distinct components are injected", () => {
      const mounted = { count: 0 };
      const makeStep = () => {
        const Step = () => {
          useEffect(() => {
            mounted.count += 1;
          }, []);
          return null;
        };
        return Step;
      };

      const count = countMounts(
        {
          ...platformComponents,
          PreChecksComponent: makeStep(),
          CreateBackupComponent: makeStep(),
          ApplyUpdatesComponent: makeStep(),
        },
        mounted,
      );

      expect(count).toBe(3);
    });
  });

  describe("closing the workflow", () => {
    const preChecks: OsUpdatesProgress = {
      step: OsUpdatesSteps.PRE_CHECKS,
      state: { type: PreChecksStateType.LOADING },
    };

    const renderWith = (progress: OsUpdatesProgress) => {
      mockProgress(progress);
      const input = makeInput();
      render(<OsUpdatesOrchestratorComponent {...input} platformComponents={platformComponents} />);
      return input;
    };

    it("does not show the confirmation until the user asks to close", () => {
      renderWith(preChecks);

      expect(screen.queryByTestId("close-confirmation")).toBeNull();
    });

    it("asks for a confirmation instead of stopping when the user closes", () => {
      const input = renderWith(preChecks);

      fireEvent.click(screen.getByTestId("pre-checks"));

      expect(screen.getByTestId("close-confirmation")).toBeTruthy();
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it("tells the step that the confirmation is open", () => {
      renderWith(preChecks);

      expect(screen.getByTestId("pre-checks").dataset.confirmationOpen).toBe("false");

      fireEvent.click(screen.getByTestId("pre-checks"));

      expect(screen.getByTestId("pre-checks").dataset.confirmationOpen).toBe("true");
    });

    it("keeps the workflow going when the user continues", () => {
      const input = renderWith(preChecks);
      fireEvent.click(screen.getByTestId("pre-checks"));

      fireEvent.click(screen.getByTestId("continue"));

      expect(screen.queryByTestId("close-confirmation")).toBeNull();
      expect(screen.getByTestId("pre-checks").dataset.confirmationOpen).toBe("false");
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it("stops the workflow when the user confirms the cancellation", () => {
      const input = renderWith(preChecks);
      fireEvent.click(screen.getByTestId("pre-checks"));

      fireEvent.click(screen.getByTestId("cancel"));

      expect(input.onStop).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("close-confirmation")).toBeNull();
    });

    it("can ask again after the user chose to continue", () => {
      const input = renderWith(preChecks);
      fireEvent.click(screen.getByTestId("pre-checks"));
      fireEvent.click(screen.getByTestId("continue"));

      fireEvent.click(screen.getByTestId("pre-checks"));

      expect(screen.getByTestId("close-confirmation")).toBeTruthy();
      expect(input.onStop).not.toHaveBeenCalled();
    });

    it.each([
      [
        "updates applied",
        "apply-updates",
        {
          step: OsUpdatesSteps.APPLY_UPDATES,
          state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
        },
      ],
      [
        "backup restored",
        "restore-backup",
        {
          step: OsUpdatesSteps.RESTORE_BACKUP,
          state: { type: RestoreBackupStateType.BACKUP_RESTORED, restoreResult: undefined },
        },
      ],
    ] satisfies [string, string, OsUpdatesProgress][])(
      "stops at once without a confirmation once the workflow has completed (%s)",
      (_label, testId, progress) => {
        const input = renderWith(progress);

        fireEvent.click(screen.getByTestId(testId));

        expect(input.onStop).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId("close-confirmation")).toBeNull();
      },
    );

    it("withdraws a confirmation that was open when the workflow completes", () => {
      mockProgress(preChecks);
      const input = makeInput();
      const { rerender } = render(
        <OsUpdatesOrchestratorComponent {...input} platformComponents={platformComponents} />,
      );
      fireEvent.click(screen.getByTestId("pre-checks"));

      mockProgress({
        step: OsUpdatesSteps.APPLY_UPDATES,
        state: { type: ApplyUpdatesStateType.UPDATES_APPLIED, restoreResult: undefined },
      });
      rerender(
        <OsUpdatesOrchestratorComponent {...input} platformComponents={platformComponents} />,
      );

      expect(screen.queryByTestId("close-confirmation")).toBeNull();
    });
  });

  it("forwards the orchestrator input to the hook without the platform components", () => {
    mockProgress(null);
    const input = makeInput();

    render(<OsUpdatesOrchestratorComponent {...input} platformComponents={platformComponents} />);

    expect(useOsUpdatesOrchestrator).toHaveBeenCalledWith(input);
  });
});
