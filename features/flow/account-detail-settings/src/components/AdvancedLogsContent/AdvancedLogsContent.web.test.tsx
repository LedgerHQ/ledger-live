import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copyToClipboard } from "@shared/clipboard";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { advancedLogsInput } from "../../__tests__/fixtures";
import { buildAdvancedLogs } from "../../logic/buildAdvancedLogs";
import { AdvancedLogsContent } from "./AdvancedLogsContent";

jest.mock("@shared/clipboard", () => ({ copyToClipboard: jest.fn() }));

const mockCopyToClipboard = jest.mocked(copyToClipboard);
const { json, syncDate } = buildAdvancedLogs(advancedLogsInput, "en-US");

describe("AdvancedLogsContent (Web)", () => {
  beforeEach(() => {
    mockCopyToClipboard.mockResolvedValue(true);
  });

  it("shows the sync date and the logs", () => {
    render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText(`Synchronised ${syncDate}`)).toBeVisible();
    expect(screen.getByTestId("account-settings-advanced-logs-json").textContent).toBe(json);
  });

  it("explains the derivation mode only when a tag is passed", () => {
    const { rerender } = render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
      wrapper: I18nWrapper,
    });
    expect(screen.queryByText(/xpub. When importing it/)).not.toBeInTheDocument();

    rerender(
      <AdvancedLogsContent
        input={advancedLogsInput}
        locale="en-US"
        derivationTag="native segwit"
      />,
    );

    expect(screen.getByText(/This is a native segwit xpub/)).toBeVisible();
  });

  it("copies the logs and reports the result", async () => {
    const user = userEvent.setup();
    const onCopied = jest.fn();
    render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" onCopied={onCopied} />, {
      wrapper: I18nWrapper,
    });

    await user.click(screen.getByRole("button", { name: "Copy logs" }));

    expect(mockCopyToClipboard).toHaveBeenCalledWith(json);
    await waitFor(() => expect(onCopied).toHaveBeenCalledWith(true));
  });

  it("formats the sync date with the formatting locale, not the translation language", () => {
    const { rerender } = render(<AdvancedLogsContent input={advancedLogsInput} locale="en-GB" />, {
      wrapper: I18nWrapper,
    });
    const britishDate = buildAdvancedLogs(advancedLogsInput, "en-GB").syncDate;
    const americanDate = buildAdvancedLogs(advancedLogsInput, "en-US").syncDate;
    expect(britishDate).not.toBe(americanDate);

    expect(screen.getByText(`Synchronised ${britishDate}`)).toBeVisible();

    rerender(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />);

    expect(screen.getByText(`Synchronised ${americanDate}`)).toBeVisible();
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

      await user.click(screen.getByRole("button", { name: "Copy logs" }));

      expect(await screen.findByRole("button", { name: "Copied" })).toBeVisible();

      act(() => jest.advanceTimersByTime(2000));

      expect(screen.getByRole("button", { name: "Copy logs" })).toBeVisible();
    });

    it("keeps Copy logs when the copy fails", async () => {
      mockCopyToClipboard.mockResolvedValue(false);
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<AdvancedLogsContent input={advancedLogsInput} locale="en-US" />, {
        wrapper: I18nWrapper,
      });

      await user.click(screen.getByRole("button", { name: "Copy logs" }));

      await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalled());
      expect(screen.getByRole("button", { name: "Copy logs" })).toBeVisible();
    });
  });
});
