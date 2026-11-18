import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { BITCOIN_ACCOUNT, ETHEREUM_ACCOUNT, createFakePort } from "../../__tests__/fixtures";
import type { HistoryExportPort } from "../../model/ports";
import { HistoryExportDialog } from "./HistoryExportDialog";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));

function renderDialog({ open = true, port = createFakePort() } = {}) {
  const onOpenChange = jest.fn();
  render(<HistoryExportDialog open={open} onOpenChange={onOpenChange} port={port} />, {
    wrapper: I18nWrapper,
  });
  return { onOpenChange, port, user: userEvent.setup() };
}

function exportButton() {
  return screen.getByTestId("history-export-csv-confirm");
}

async function selectBitcoinAndExport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(BITCOIN_ACCOUNT.name));
  await user.click(exportButton());
}

describe("HistoryExportDialog (Web)", () => {
  it("renders nothing and does not sync while closed", () => {
    const { port } = renderDialog({ open: false });

    expect(screen.queryByTestId("history-export-dialog")).toBeNull();
    expect(port.syncAccounts).not.toHaveBeenCalled();
  });

  it("lists the accounts with their balance and syncs them when it opens", () => {
    const { port } = renderDialog();

    expect(screen.getByText("Export transaction history")).toBeVisible();
    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(screen.getByText("0.5 BTC")).toBeVisible();
    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("2 ETH")).toBeVisible();
    expect(port.syncAccounts).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id, ETHEREUM_ACCOUNT.id]);
  });

  it("enables the export once an account is selected", async () => {
    const { user } = renderDialog();

    expect(exportButton()).toBeDisabled();

    await user.click(screen.getByText("Select all (2)"));
    expect(exportButton()).toBeEnabled();

    await user.click(screen.getByText("Deselect all (2)"));
    expect(exportButton()).toBeDisabled();
  });

  it("keeps the export disabled while a selected account syncs", async () => {
    const { user } = renderDialog({ port: createFakePort({ isSyncing: () => true }) });

    await user.click(screen.getByText(BITCOIN_ACCOUNT.name));

    expect(exportButton()).toBeDisabled();
  });

  it("exports the selected accounts and shows the success", async () => {
    const { port, user } = renderDialog();

    await selectBitcoinAndExport(user);

    expect(port.exportCsv).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id]);
    expect(await screen.findByTestId("history-export-success-title")).toHaveTextContent(
      "Transaction history saved successfully",
    );
    expect(
      screen.getByText("Transaction history saved successfully").closest("[data-height]"),
    ).toHaveAttribute("data-height", "fit");
  });

  it("stays on the selection when the save is canceled", async () => {
    const { user } = renderDialog({
      port: createFakePort({ exportCsv: jest.fn(async () => "canceled" as const) }),
    });

    await selectBitcoinAndExport(user);

    expect(screen.getByTestId("history-export-dialog")).toBeVisible();
    expect(screen.queryByTestId("history-export-success-title")).toBeNull();
  });

  it("shows the error and goes back to an empty selection on try again", async () => {
    const port: HistoryExportPort = createFakePort({
      exportCsv: jest.fn(async () => "failed" as const),
    });
    const { user } = renderDialog({ port });

    await selectBitcoinAndExport(user);
    expect(await screen.findByTestId("history-export-error-title")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByTestId("history-export-dialog")).toHaveAttribute("data-height", "fixed");
    expect(exportButton()).toBeDisabled();
  });
});
