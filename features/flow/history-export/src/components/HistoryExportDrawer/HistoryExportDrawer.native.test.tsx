import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { BITCOIN_ACCOUNT, ETHEREUM_ACCOUNT, createFakePort } from "../../__tests__/fixtures";
import type { HistoryExportPort } from "../../model/ports";
import { HistoryExportDrawer } from "./HistoryExportDrawer";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ TrackScreen: () => null }));

function renderDrawer({ port = createFakePort() }: { port?: HistoryExportPort } = {}) {
  const onClose = jest.fn();
  render(<HistoryExportDrawer onClose={onClose} port={port} />, { wrapper: I18nWrapper });
  return { onClose, port, user: userEvent.setup() };
}

// The Lumen stub renders a Button as a plain host element: no role, `disabled` stays a prop.
const exportButton = () => screen.getByTestId("history-export-csv-confirm");

describe("HistoryExportDrawer (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists the accounts with their balance and syncs them when it opens", () => {
    const { port } = renderDrawer();

    expect(screen.getByTestId("history-export-drawer")).toBeExpanded();
    expect(screen.getByText("Estimated values only.")).toBeVisible();
    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(screen.getByText("0.5 BTC")).toBeVisible();
    expect(screen.getByText("Ethereum 1")).toBeVisible();
    expect(screen.getByText("2 ETH")).toBeVisible();
    expect(port.syncAccounts).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id, ETHEREUM_ACCOUNT.id]);
  });

  it("enables the export once an account is selected", async () => {
    const { user } = renderDrawer();

    expect(exportButton()).toHaveProp("disabled", true);

    await user.press(screen.getByText("Select all (2)"));
    expect(exportButton()).toHaveProp("disabled", false);

    await user.press(screen.getByText("Deselect all (2)"));
    expect(exportButton()).toHaveProp("disabled", true);
  });

  it("keeps the export disabled and loading while a selected account syncs", async () => {
    const { user } = renderDrawer({ port: createFakePort({ isSyncing: () => true }) });

    await user.press(screen.getByText("Bitcoin 1"));

    expect(exportButton()).toHaveProp("disabled", true);
    expect(exportButton()).toHaveProp("loading", true);
  });

  it("exports the selected account, shows the success and closes the drawer on done", async () => {
    const { port, user } = renderDrawer();

    await user.press(screen.getByText("Bitcoin 1"));
    await user.press(exportButton());

    expect(port.exportCsv).toHaveBeenCalledWith([BITCOIN_ACCOUNT.id]);
    expect(await screen.findByText("Transaction history saved successfully")).toBeVisible();
    expect(screen.queryByTestId("history-export-csv-confirm")).toBeNull();

    await user.press(screen.getByText("Done"));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Done",
      page: "Dialog Transaction History successfully",
    });
    expect(screen.getByTestId("history-export-drawer")).toBeCollapsed();
  });

  it("closes when the drawer is dismissed", async () => {
    const { onClose, user } = renderDrawer();

    await user.press(screen.getByTestId("history-export-drawer-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays on the selection when the share is canceled", async () => {
    const { user } = renderDrawer({
      port: createFakePort({ exportCsv: jest.fn(async () => "canceled" as const) }),
    });

    await user.press(screen.getByText("Bitcoin 1"));
    await user.press(exportButton());

    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(exportButton()).toHaveProp("disabled", false);
    expect(screen.queryByText("Transaction history saved successfully")).toBeNull();
  });

  it("shows the error and goes back to an empty selection on try again", async () => {
    const { user } = renderDrawer({
      port: createFakePort({ exportCsv: jest.fn(async () => "failed" as const) }),
    });

    await user.press(screen.getByText("Bitcoin 1"));
    await user.press(exportButton());
    expect(await screen.findByText("Something went wrong")).toBeVisible();

    await user.press(screen.getByText("Try again"));

    expect(screen.getByText("Bitcoin 1")).toBeVisible();
    expect(exportButton()).toHaveProp("disabled", true);
  });
});
