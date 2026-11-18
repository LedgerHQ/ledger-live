import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { BITCOIN_ACCOUNT, ETHEREUM_ACCOUNT, createFakePort } from "../../__tests__/fixtures";
import type { HistoryExportPort } from "../../model/ports";
import { HistoryExportDrawer } from "./HistoryExportDrawer";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));

function renderDrawer({
  isOpen = true,
  port = createFakePort(),
}: { isOpen?: boolean; port?: HistoryExportPort } = {}) {
  const onClose = jest.fn();
  render(<HistoryExportDrawer isOpen={isOpen} onClose={onClose} port={port} />, {
    wrapper: I18nWrapper,
  });
  return { onClose, port, user: userEvent.setup() };
}

const exportButton = () => screen.getByTestId("history-export-csv-confirm");

describe("HistoryExportDrawer (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing and does not sync while closed", () => {
    const { port } = renderDrawer({ isOpen: false });

    expect(screen.queryByTestId("history-export-drawer")).toBeNull();
    expect(port.syncAccounts).not.toHaveBeenCalled();
  });

  it("lists the accounts with their balance and syncs them when it opens", () => {
    const { port } = renderDrawer();

    expect(screen.UNSAFE_getByProps({ title: "Export transaction history" })).toBeTruthy();
    expect(screen.getByText("Estimated values only.")).toBeTruthy();
    expect(screen.getByText("Bitcoin 1")).toBeTruthy();
    expect(screen.getByText("0.5 BTC")).toBeTruthy();
    expect(screen.getByText("Ethereum 1")).toBeTruthy();
    expect(screen.getByText("2 ETH")).toBeTruthy();
    expect(port.syncAccounts).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id, ETHEREUM_ACCOUNT.id]);
  });

  it("enables the export once an account is selected", async () => {
    const { user } = renderDrawer();

    expect(exportButton().props.disabled).toBe(true);

    await user.press(screen.getByText("Select all (2)"));
    expect(exportButton().props.disabled).toBe(false);

    await user.press(screen.getByText("Deselect all (2)"));
    expect(exportButton().props.disabled).toBe(true);
  });

  it("keeps the export disabled and loading while a selected account syncs", async () => {
    const { user } = renderDrawer({ port: createFakePort({ isSyncing: () => true }) });

    await user.press(screen.getByTestId(`history-export-account-${BITCOIN_ACCOUNT.id}`));

    expect(exportButton().props.disabled).toBe(true);
    expect(exportButton().props.loading).toBe(true);
  });

  it("exports the selected account, shows the success and closes on done", async () => {
    const { onClose, port, user } = renderDrawer();

    await user.press(screen.getByTestId(`history-export-account-${BITCOIN_ACCOUNT.id}`));
    await user.press(exportButton());

    expect(port.exportCsv).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id]);
    expect(await screen.findByText("Transaction history saved successfully")).toBeTruthy();
    expect(screen.queryByTestId("history-export-csv-confirm")).toBeNull();

    await user.press(screen.getByTestId("history-export-success-cta"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Done",
      page: "Dialog Transaction History successfully",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("stays on the selection when the share is canceled", async () => {
    const { user } = renderDrawer({
      port: createFakePort({ exportCsv: jest.fn(async () => "canceled" as const) }),
    });

    await user.press(screen.getByTestId(`history-export-account-${BITCOIN_ACCOUNT.id}`));
    await user.press(exportButton());

    expect(screen.getByTestId("history-export-dialog")).toBeTruthy();
    expect(screen.queryByText("Transaction history saved successfully")).toBeNull();
  });

  it("shows the error and goes back to an empty selection on try again", async () => {
    const { user } = renderDrawer({
      port: createFakePort({ exportCsv: jest.fn(async () => "failed" as const) }),
    });

    await user.press(screen.getByTestId(`history-export-account-${BITCOIN_ACCOUNT.id}`));
    await user.press(exportButton());
    expect(await screen.findByText("Something went wrong")).toBeTruthy();

    await user.press(screen.getByTestId("history-export-error-cta"));

    expect(screen.getByTestId("history-export-dialog")).toBeTruthy();
    expect(exportButton().props.disabled).toBe(true);
  });
});
