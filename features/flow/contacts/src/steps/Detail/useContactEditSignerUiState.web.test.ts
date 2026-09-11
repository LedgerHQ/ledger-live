import { act, renderHook } from "@testing-library/react";
import { useContactEditSignerUiState } from "./useContactEditSignerUiState";

describe("useContactEditSignerUiState", () => {
  it("should open the edit dialog", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
    });

    expect(result.current.editUiState).toBe("edit-open");
    expect(result.current.isEditSessionActive).toBe(true);
  });

  it("should replace the edit dialog with the mismatch dialog", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
    });

    expect(result.current.editUiState).toBe("signer-mismatch");
  });

  it("should return to the edit dialog when the user connects a different device", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
    });

    act(() => {
      result.current.onConnectDifferentDevice();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should return to the edit dialog when the mismatch is cancelled", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
    });

    act(() => {
      result.current.onSignerMismatchCancel();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should ignore a mismatch cancel fired after leaving the mismatch step", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
    });

    act(() => {
      result.current.onConnectDifferentDevice();
      result.current.onSignerMismatchCancel();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should close the edit dialog only from the edit step", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
      result.current.onEditClose();
    });

    expect(result.current.editUiState).toBe("signer-mismatch");

    act(() => {
      result.current.onSignerMismatchCancel();
      result.current.onEditClose();
    });

    expect(result.current.editUiState).toBe("closed");
    expect(result.current.isEditSessionActive).toBe(false);
  });

  it("should close any step when the flow is reset", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      result.current.openSignerMismatchDialog();
    });

    act(() => {
      result.current.resetEditUiState();
    });

    expect(result.current.editUiState).toBe("closed");
  });
});
