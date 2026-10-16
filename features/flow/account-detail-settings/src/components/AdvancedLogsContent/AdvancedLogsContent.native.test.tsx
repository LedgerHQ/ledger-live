import React from "react";
import { act, fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { copyToClipboard } from "@shared/clipboard";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { advancedLogsInput } from "../../__tests__/fixtures";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import { AdvancedLogsContent } from "./AdvancedLogsContent";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn() }));

const mockCopyToClipboard = jest.mocked(copyToClipboard);
const { json, syncDate } = buildAdvancedLogs(advancedLogsInput, "en-US");

describe("AdvancedLogsContent (Native)", () => {
  beforeEach(() => {
    mockCopyToClipboard.mockResolvedValue(true);
  });

  it("shows the sync date, the logs and the derivation tip", () => {
    render(
      <AdvancedLogsContent
        input={advancedLogsInput}
        locale="en-US"
        derivationTag="native segwit"
      />,
      {
        wrapper: I18nWrapper,
      },
    );

    expect(screen.getByText(`Synchronised ${syncDate}`)).toBeVisible();
    expect(screen.getByTestId("account-settings-advanced-logs-json").props.children).toBe(json);
    expect(screen.getByText(/This is a native segwit xpub/)).toBeVisible();
  });

  it("copies the logs and reports the result", async () => {
    const onCopied = jest.fn();
    render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" onCopied={onCopied} />, {
      wrapper: I18nWrapper,
    });

    fireEvent.press(screen.getByTestId("account-settings-copy-logs"));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(json);
    await waitFor(() => expect(onCopied).toHaveBeenCalledWith(true));
  });

  describe("copied feedback", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("shows Copied after copying, then goes back to Copy logs", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
        wrapper: I18nWrapper,
      });

      await user.press(screen.getByText("Copy logs"));

      expect(await screen.findByText("Copied")).toBeVisible();

      act(() => jest.advanceTimersByTime(2000));

      expect(screen.getByText("Copy logs")).toBeVisible();
      expect(screen.queryByText("Copied")).toBeNull();
    });

    it("restarts the delay when copying again", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
        wrapper: I18nWrapper,
      });

      await user.press(screen.getByText("Copy logs"));
      await screen.findByText("Copied");
      act(() => jest.advanceTimersByTime(1500));
      await user.press(screen.getByText("Copied"));
      act(() => jest.advanceTimersByTime(1500));

      expect(screen.getByText("Copied")).toBeVisible();

      act(() => jest.advanceTimersByTime(500));

      expect(screen.getByText("Copy logs")).toBeVisible();
    });

    it("keeps Copy logs when the copy fails", async () => {
      mockCopyToClipboard.mockResolvedValue(false);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
        wrapper: I18nWrapper,
      });

      await user.press(screen.getByText("Copy logs"));

      await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalled());
      expect(screen.getByText("Copy logs")).toBeVisible();
      expect(screen.queryByText("Copied")).toBeNull();
    });
  });
});
