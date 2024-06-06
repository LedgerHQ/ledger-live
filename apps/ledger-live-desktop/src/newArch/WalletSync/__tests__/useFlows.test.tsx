/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { describe, expect, it, jest } from "@jest/globals";

import { FlowOptions, useFlows } from "../Flows/useFlows";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { renderHook } from "tests/testUtils";
import { act } from "react-dom/test-utils";

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

describe("useFlows", () => {
  it("should loads rights Steps for Flow.ManageBackups", async () => {
    const steps = FlowOptions.ManageBackups.steps;

    const { result } = renderHook(
      () =>
        useFlows({
          flow: Flow.ManageBackups,
        }),
      {},
    );

    expect(result.current.currentStep).toBe(Object.values(steps)[0]);

    act(() => {
      result.current.goToNextScene();
    });
    expect(result.current.currentStep).toBe(Object.values(steps)[1]);
    act(() => {
      result.current.goToNextScene();
    });
    expect(result.current.currentStep).toBe(Object.values(steps)[2]);

    act(() => {
      result.current.goToPreviousScene();
    });
    expect(result.current.currentStep).toBe(Object.values(steps)[1]);
  });

  it("should reset Flow and Step", async () => {
    const steps = FlowOptions.ManageBackups.steps;

    const { result, store } = renderHook(
      () =>
        useFlows({
          flow: Flow.ManageBackups,
        }),
      {},
    );

    expect(result.current.currentStep).toBe(Object.values(steps)[0]);

    act(() => {
      result.current.resetFlows();
    });
    expect(store.getState().walletSync.step).toBe(Step.CreateOrSynchronizeStep);
    expect(store.getState().walletSync.flow).toBe(Flow.Activation);
  });
});
