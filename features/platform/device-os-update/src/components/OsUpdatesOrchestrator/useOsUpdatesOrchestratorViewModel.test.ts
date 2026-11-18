/**
 * @jest-environment jsdom
 */
// oxlint-disable typescript/consistent-type-assertions
import { act, renderHook } from "@testing-library/react";
import { PreChecksStateType } from "../../types/PreChecksState";
import { OsUpdatesSteps } from "../../types/OsUpdatesSteps";
import type { OsUpdatesProgress } from "../../types/OsUpdatesProgress";
import { useOsUpdatesOrchestrator } from "../../hooks/useOsUpdatesOrchestrator";
import type { OsUpdatesOrchestratorProps } from "./OsUpdatesOrchestrator";
import { useOsUpdatesOrchestratorViewModel } from "./useOsUpdatesOrchestratorViewModel";

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
const preChecks: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.LOADING },
};
const renderStep = jest.fn();
const renderCloseConfirmation = jest.fn();

const render = (props: Partial<OsUpdatesOrchestratorProps> = {}) =>
  renderHook(() => useOsUpdatesOrchestratorViewModel({ ...input, renderStep, ...props }));

describe("useOsUpdatesOrchestratorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useOsUpdatesOrchestrator).mockReturnValue({ osUpdatesProgress: preChecks });
  });

  it("runs the orchestrator with the input only", () => {
    render({ renderCloseConfirmation, onCompleted: jest.fn() });

    expect(useOsUpdatesOrchestrator).toHaveBeenCalledWith({
      dmk: input.dmk,
      connectedDevice: input.connectedDevice,
      osUpdates: input.osUpdates,
      storage: input.backupStorage,
      onStop: input.onStop,
      unlockTimeout: undefined,
    });
  });

  it("gives the view the current step and the render props", () => {
    const { result } = render({ renderCloseConfirmation });

    expect(result.current.stepProps).toMatchObject({
      ...preChecks,
      connectedDevice: input.connectedDevice,
    });
    expect(result.current.renderStep).toBe(renderStep);
    expect(result.current.renderCloseConfirmation).toBe(renderCloseConfirmation);
  });

  it("asks for a confirmation on close when the caller renders one", () => {
    const { result } = render({ renderCloseConfirmation });

    act(() => result.current.stepProps.onUserClose());

    expect(result.current.closeConfirmation.isOpen).toBe(true);
    expect(input.onStop).not.toHaveBeenCalled();
  });

  it("stops at once on close when the caller renders no confirmation", () => {
    const { result } = render();

    act(() => result.current.stepProps.onUserClose());

    expect(input.onStop).toHaveBeenCalledTimes(1);
  });
});
