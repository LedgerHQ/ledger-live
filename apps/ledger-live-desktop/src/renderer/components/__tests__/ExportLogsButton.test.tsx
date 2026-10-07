import React from "react";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { dialogs } from "~/renderer/bridge";
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
}));

jest.mock("~/helpers/saveLogs", () => ({
  saveLogs: jest.fn(() => Promise.resolve()),
}));

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
    expect(dialogs.showSave).toHaveBeenCalledWith(expect.anything());
  });

  it("does not export the logs on e without ctrl", async () => {
    render(<ExportLogsButton hookToShortcut />);

    await pressCtrlE({ key: "e" });

    expect(dialogs.showSave).not.toHaveBeenCalled();
  });

  it("does not listen to the shortcut when it renders the button", async () => {
    render(<ExportLogsButton />);

    await pressCtrlE();

    expect(dialogs.showSave).not.toHaveBeenCalled();
  });
});
