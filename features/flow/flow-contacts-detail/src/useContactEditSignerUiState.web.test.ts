import { act, renderHook } from "@testing-library/react";
import { useContactEditSignerUiState } from "./useContactEditSignerUiState";

describe("useContactEditSignerUiState", () => {
  it("should open the edit dialog without asking for the signer", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
    });

    expect(result.current.editUiState).toBe("edit-open");
    expect(result.current.isEditSessionActive).toBe(true);
  });

  it("should open the signer dialog and keep the approval pending until it is granted", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    const onApproval = jest.fn();
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
      void approval.then(onApproval);
    });

    expect(result.current.editUiState).toBe("signer-open");
    expect(onApproval).not.toHaveBeenCalled();

    await act(async () => {
      result.current.grantSignerApproval();
      await approval;
    });

    expect(result.current.editUiState).toBe("edit-open");
    expect(onApproval).toHaveBeenCalledWith(true);
  });

  it("should decline the approval and return to the edit dialog when the signer is cancelled", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
    });

    await act(async () => {
      result.current.onSignerCancel();
      await expect(approval).resolves.toBe(false);
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should ignore a signer cancel fired after leaving the signer step", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
    });

    await act(async () => {
      result.current.grantSignerApproval();
      await approval;
    });

    act(() => {
      result.current.onSignerCancel();
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should keep the approval pending while the user connects a different device", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    const onApproval = jest.fn();
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
      void approval.then(onApproval);
      result.current.openSignerMismatchDialog();
    });

    expect(result.current.editUiState).toBe("signer-mismatch");

    act(() => {
      result.current.onConnectDifferentDevice();
    });

    expect(result.current.editUiState).toBe("signer-open");
    expect(onApproval).not.toHaveBeenCalled();

    await act(async () => {
      result.current.grantSignerApproval();
      await approval;
    });

    expect(onApproval).toHaveBeenCalledWith(true);
  });

  it("should decline the approval and return to the edit dialog when the mismatch is cancelled", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
      result.current.openSignerMismatchDialog();
    });

    await act(async () => {
      result.current.onSignerMismatchCancel();
      await expect(approval).resolves.toBe(false);
    });

    expect(result.current.editUiState).toBe("edit-open");
  });

  it("should ignore a mismatch cancel fired after leaving the mismatch step", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    const onApproval = jest.fn();
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
      void approval.then(onApproval);
      result.current.openSignerMismatchDialog();
    });

    act(() => {
      result.current.onConnectDifferentDevice();
      result.current.onSignerMismatchCancel();
    });

    expect(result.current.editUiState).toBe("signer-open");
    expect(onApproval).not.toHaveBeenCalled();

    await act(async () => {
      result.current.grantSignerApproval();
      await approval;
    });

    expect(onApproval).toHaveBeenCalledWith(true);
  });

  it("should close the edit dialog only from the edit step", () => {
    const { result } = renderHook(() => useContactEditSignerUiState());

    act(() => {
      result.current.openEditDialog();
      void result.current.requestSignerApproval();
      result.current.onEditClose();
    });

    expect(result.current.editUiState).toBe("signer-open");

    act(() => {
      result.current.grantSignerApproval();
      result.current.onEditClose();
    });

    expect(result.current.editUiState).toBe("closed");
    expect(result.current.isEditSessionActive).toBe(false);
  });

  it("should decline the approval when the flow is reset", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    let approval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      approval = result.current.requestSignerApproval();
    });

    await act(async () => {
      result.current.resetEditUiState();
      await expect(approval).resolves.toBe(false);
    });

    expect(result.current.editUiState).toBe("closed");
  });

  it("should decline a pending approval when a new signer request replaces it", async () => {
    const { result } = renderHook(() => useContactEditSignerUiState());
    let firstApproval!: Promise<boolean>;
    let secondApproval!: Promise<boolean>;

    act(() => {
      result.current.openEditDialog();
      firstApproval = result.current.requestSignerApproval();
    });

    act(() => {
      secondApproval = result.current.requestSignerApproval();
    });

    await expect(firstApproval).resolves.toBe(false);
    expect(result.current.editUiState).toBe("signer-open");

    await act(async () => {
      result.current.grantSignerApproval();
      await expect(secondApproval).resolves.toBe(true);
    });
  });
});
