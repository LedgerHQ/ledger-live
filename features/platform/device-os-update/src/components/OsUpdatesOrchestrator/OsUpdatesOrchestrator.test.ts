/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import { createElement, useEffect } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApplyUpdatesStateType } from "../../types/ApplyUpdatesState";
import { CreateBackupStateType } from "../../types/CreateBackupState";
import { OsUpdatesSteps } from "../../types/OsUpdatesSteps";
import { PreChecksStateType } from "../../types/PreChecksState";
import type { OsUpdatesProgress } from "../../types/OsUpdatesProgress";
import type { CloseConfirmationProps, OsUpdateStepProps } from "../../types/OsUpdateStep";
import { useOsUpdatesOrchestrator } from "../../hooks/useOsUpdatesOrchestrator";
import { OsUpdatesOrchestrator, type OsUpdatesOrchestratorProps } from "./OsUpdatesOrchestrator";

jest.mock("../../hooks/useOsUpdatesOrchestrator");

const input = {
  dmk: {} as OsUpdatesOrchestratorProps["dmk"],
  connectedDevice: {
    sessionId: "session-1",
  } as OsUpdatesOrchestratorProps["connectedDevice"],
  osUpdates: [],
  backupStorage: {} as OsUpdatesOrchestratorProps["backupStorage"],
  onStop: jest.fn(),
};
const steps: OsUpdatesProgress[] = [
  { step: OsUpdatesSteps.PRE_CHECKS, state: { type: PreChecksStateType.LOADING } },
  { step: OsUpdatesSteps.CREATE_BACKUP, state: { type: CreateBackupStateType.LOADING } },
  {
    step: OsUpdatesSteps.APPLY_UPDATES,
    state: { type: ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE },
  },
];
const mockProgress = (osUpdatesProgress: OsUpdatesProgress | null) =>
  jest.mocked(useOsUpdatesOrchestrator).mockReturnValue({ osUpdatesProgress });

const mounts = { step: 0 };
function Step({ step, state, onUserClose }: OsUpdateStepProps) {
  useEffect(() => {
    mounts.step += 1;
  }, []);
  return createElement(
    "button",
    { "data-testid": "step", onClick: onUserClose },
    `${step}:${state.type}`,
  );
}
function Confirmation({ isOpen, onCancel }: CloseConfirmationProps) {
  return isOpen
    ? createElement("button", { "data-testid": "confirmation", onClick: onCancel })
    : null;
}
const renderStep = (props: OsUpdateStepProps) => createElement(Step, props);
const renderCloseConfirmation = (props: CloseConfirmationProps) =>
  createElement(Confirmation, props);

const orchestrator = () =>
  createElement(OsUpdatesOrchestrator, { ...input, renderStep, renderCloseConfirmation });

describe("OsUpdatesOrchestrator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mounts.step = 0;
  });

  it("runs the orchestrator with the input, without the render props", () => {
    mockProgress(null);

    render(orchestrator());

    expect(useOsUpdatesOrchestrator).toHaveBeenCalledWith({
      dmk: input.dmk,
      connectedDevice: input.connectedDevice,
      osUpdates: input.osUpdates,
      storage: input.backupStorage,
      onStop: input.onStop,
      unlockTimeout: undefined,
    });
  });

  it("renders each step with the component of the caller, mounted once", () => {
    mockProgress(steps[0]);
    const { rerender } = render(orchestrator());
    for (const next of steps.slice(1)) {
      mockProgress(next);
      rerender(orchestrator());
    }

    expect(screen.getByTestId("step").textContent).toBe(
      `${OsUpdatesSteps.APPLY_UPDATES}:${ApplyUpdatesStateType.AWAITING_UPDATE_COMPLETE}`,
    );
    expect(mounts.step).toBe(1);
  });

  it("renders the close confirmation of the caller, and stops on cancel", () => {
    mockProgress(steps[0]);
    render(orchestrator());

    fireEvent.click(screen.getByTestId("step"));
    fireEvent.click(screen.getByTestId("confirmation"));

    expect(input.onStop).toHaveBeenCalledTimes(1);
  });

  it("stops at once when the caller renders no close confirmation", () => {
    mockProgress(steps[0]);
    render(createElement(OsUpdatesOrchestrator, { ...input, renderStep }));

    fireEvent.click(screen.getByTestId("step"));

    expect(input.onStop).toHaveBeenCalledTimes(1);
  });
});
