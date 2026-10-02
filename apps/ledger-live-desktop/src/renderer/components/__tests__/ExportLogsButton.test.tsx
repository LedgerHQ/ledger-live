import React from "react";
import { ipcRenderer } from "electron";
import { act, fireEvent, render, screen } from "tests/testSetup";
import ExportLogsButton from "../ExportLogsButton";

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    critical: jest.fn(),
    onReduxAction: jest.fn(),
  },
}));

jest.mock("electron", () => ({
  webFrame: { getResourceUsage: jest.fn(() => ({})) },
  ipcRenderer: {
    invoke: jest.fn(() => Promise.resolve(undefined)),
  },
}));

jest.mock("~/helpers/saveLogs", () => ({
  saveLogs: jest.fn(() => Promise.resolve()),
}));

const mockInvoke = jest.mocked(ipcRenderer.invoke);

const pressCtrlE = async (init: KeyboardEventInit = { key: "e", ctrlKey: true }) => {
  await act(async () => {
    fireEvent.keyUp(document.body, init);
  });
};

describe("ExportLogsButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the button when it is not hooked to the shortcut", () => {
    render(<ExportLogsButton />);

    expect(screen.getByTestId("export-logs-button")).toBeVisible();
  });

  it("exports the logs on ctrl+e when hooked to the shortcut", async () => {
    render(<ExportLogsButton hookToShortcut />);

    await pressCtrlE();

    expect(screen.queryByTestId("export-logs-button")).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("show-save-dialog", expect.anything());
  });

  it("does not export the logs on e without ctrl", async () => {
    render(<ExportLogsButton hookToShortcut />);

    await pressCtrlE({ key: "e" });

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("does not listen to the shortcut when it renders the button", async () => {
    render(<ExportLogsButton />);

    await pressCtrlE();

    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
