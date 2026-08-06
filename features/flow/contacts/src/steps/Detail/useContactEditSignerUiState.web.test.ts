import { act, renderHook } from "@testing-library/react";
import { useContactEditSignerUiState } from "./useContactEditSignerUiState";

describe("useContactEditSignerUiState", () => {
  it("should open the signer dialog", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openSignerDialog();
    });

    expect(result.current.editUiState).toBe("signer-open");
  });

  it("should transition to edit-open after signer confirmation", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openSignerDialog();
      result.current.onSignerConfirm();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should keep edit-open when signer close fires after confirm", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openSignerDialog();
      result.current.onSignerConfirm();
      result.current.onSignerCancel();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should reset to closed when edit is closed or reset", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.onEditClose();
    });

    expect(result.current.editUiState).toBe("closed");

    act(() => {
      result.current.openSignerDialog();
      result.current.resetEditUiState();
    });

    expect(result.current.editUiState).toBe("closed");
  });

  it("should open the signer mismatch dialog and close it on cancel", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openSignerMismatchDialog();
    });

    expect(result.current.editUiState).toBe("signer-mismatch");

    act(() => {
      result.current.onSignerMismatchCancel();
    });

    expect(result.current.editUiState).toBe("closed");
  });

  it("should return to the signer dialog when connecting a different device", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openSignerMismatchDialog();
      result.current.onConnectDifferentDevice();
    });

    expect(result.current.editUiState).toBe("signer-open");
  });
});
