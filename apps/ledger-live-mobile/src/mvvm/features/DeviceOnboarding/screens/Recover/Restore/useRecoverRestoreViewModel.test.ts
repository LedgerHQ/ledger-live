import { act, renderHook } from "@tests/test-renderer";
import { track } from "@shared/analytics";
import { useRecoverRestoreViewModel } from "./useRecoverRestoreViewModel";

const device = { deviceType: "stax", deviceVersion: "1.8.0" };

describe("useRecoverRestoreViewModel", () => {
  beforeEach(() => {
    jest.mocked(track).mockClear();
  });

  it("should track close and then leave the screen", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useRecoverRestoreViewModel({ ...device, onClose, onContinue: jest.fn() }),
    );

    act(() => result.current.onClose());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "close",
      page: "Onboarding - Restore with Recover",
      sourceFlow: "onboarding",
      source: "Onboarding - Restore",
      seedConfiguration: "recover_seed",
      deviceType: "stax",
      deviceVersion: "1.8.0",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should track the CTA and then open Recover", () => {
    const onContinue = jest.fn();
    const { result } = renderHook(() =>
      useRecoverRestoreViewModel({ ...device, onClose: jest.fn(), onContinue }),
    );

    act(() => result.current.onContinue());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Continue to Ledger Recover",
      page: "Onboarding - Restore with Recover",
      sourceFlow: "onboarding",
      source: "Onboarding - Restore",
      seedConfiguration: "recover_seed",
      deviceType: "stax",
      deviceVersion: "1.8.0",
    });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
