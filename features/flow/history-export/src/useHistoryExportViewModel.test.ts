import { act, renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import { useHistoryExportViewModel } from "./useHistoryExportViewModel";
import { BITCOIN_ACCOUNT, ETHEREUM_ACCOUNT, createFakePort } from "./__tests__/fixtures";
import type { HistoryExportPort } from "./model/ports";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

/** An export that saves only when the test says so. */
function pendingSave() {
  let resolve: ((outcome: "saved") => void) | undefined;
  const promise = new Promise<"saved">(settle => {
    resolve = settle;
  });
  return { promise, resolve: (outcome: "saved") => resolve?.(outcome) };
}

function renderViewModel(port: HistoryExportPort) {
  return renderHook(() => useHistoryExportViewModel({ port }));
}

describe("useHistoryExportViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts with nothing selected and the export disabled", () => {
    const { result } = renderViewModel(createFakePort());

    expect(result.current.checkedIds).toEqual([]);
    expect(result.current.disabled).toBe(true);
    expect(result.current.allSelected).toBe(false);
  });

  it("toggles one account", () => {
    const { result } = renderViewModel(createFakePort());

    act(() => result.current.toggleAccount(BITCOIN_ACCOUNT.id));
    expect(result.current.checkedIds).toEqual([BITCOIN_ACCOUNT.id]);
    expect(result.current.disabled).toBe(false);

    act(() => result.current.toggleAccount(BITCOIN_ACCOUNT.id));
    expect(result.current.checkedIds).toEqual([]);
  });

  it("selects then deselects every account", () => {
    const { result } = renderViewModel(createFakePort());

    act(() => result.current.onSelectAllToggle());
    expect(result.current.allSelected).toBe(true);

    act(() => result.current.onSelectAllToggle());
    expect(result.current.checkedIds).toEqual([]);
  });

  it("is loading while the export runs and ignores another export meanwhile", async () => {
    const pending = pendingSave();
    const port = createFakePort({ exportCsv: jest.fn(() => pending.promise) });
    const { result } = renderViewModel(port);
    act(() => result.current.toggleAccount(ETHEREUM_ACCOUNT.id));
    expect(result.current.isLoading).toBe(false);

    let firstExport: Promise<void> = Promise.resolve();
    act(() => {
      firstExport = result.current.exportCsv();
      void result.current.exportCsv();
    });

    expect(result.current.isLoading).toBe(true);
    expect(port.exportCsv).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve("saved");
      await firstExport;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.success).toBe(true);
  });

  it("exports the selected accounts and shows the success when the file is saved", async () => {
    const port = createFakePort();
    const { result } = renderViewModel(port);

    act(() => result.current.toggleAccount(BITCOIN_ACCOUNT.id));
    await act(() => result.current.exportCsv());

    expect(port.exportCsv).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id]);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Export history",
      page: "Dialog Transaction History",
    });
    expect(trackPage).toHaveBeenCalledWith(
      { category: "Dialog Transaction History", name: "successfully" },
      { updateRoutes: true },
    );
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe(false);
  });

  it("stays on the selection when the save is canceled", async () => {
    const port = createFakePort({ exportCsv: jest.fn(async () => "canceled" as const) });
    const { result } = renderViewModel(port);

    act(() => result.current.toggleAccount(BITCOIN_ACCOUNT.id));
    await act(() => result.current.exportCsv());

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.checkedIds).toEqual([BITCOIN_ACCOUNT.id]);
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("shows the error when the save fails", async () => {
    const port = createFakePort({ exportCsv: jest.fn(async () => "failed" as const) });
    const { result } = renderViewModel(port);

    await act(() => result.current.exportCsv());

    expect(result.current.error).toBe(true);
    expect(trackPage).not.toHaveBeenCalled();
  });

  it("shows the error when the export throws", async () => {
    const port = createFakePort({
      exportCsv: jest.fn(async () => {
        throw new Error("boom");
      }),
    });
    const { result } = renderViewModel(port);

    await act(() => result.current.exportCsv());

    expect(result.current.error).toBe(true);
  });

  it("resets the result and the selection", async () => {
    const port = createFakePort({ exportCsv: jest.fn(async () => "failed" as const) });
    const { result } = renderViewModel(port);

    act(() => result.current.toggleAccount(BITCOIN_ACCOUNT.id));
    await act(() => result.current.exportCsv());
    act(() => result.current.resetState());

    expect(result.current.error).toBe(false);
    expect(result.current.checkedIds).toEqual([]);
  });

  it("fits the dialog to a result and resets it to fixed", async () => {
    const setDialogHeight = jest.fn();
    const { result } = renderHook(() =>
      useHistoryExportViewModel({ port: createFakePort(), setDialogHeight }),
    );

    await act(() => result.current.exportCsv());
    expect(setDialogHeight).toHaveBeenLastCalledWith("fit");

    act(() => result.current.resetState());
    expect(setDialogHeight).toHaveBeenLastCalledWith("fixed");
  });

  it("does not resize the dialog when the save is canceled", async () => {
    const setDialogHeight = jest.fn();
    const port = createFakePort({ exportCsv: jest.fn(async () => "canceled" as const) });
    const { result } = renderHook(() => useHistoryExportViewModel({ port, setDialogHeight }));

    await act(() => result.current.exportCsv());

    expect(setDialogHeight).not.toHaveBeenCalled();
  });

  it("tracks the done click", () => {
    const { result } = renderViewModel(createFakePort());

    act(() => result.current.onDoneClick());

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Done",
      page: "Dialog Transaction History successfully",
    });
  });
});
