import React from "react";
import { MaybeUpdateContextType, UpdaterContext } from "./UpdaterContext";
import UpdaterTopBanner, { VISIBLE_STATUS } from "./Banner";
import { act, render, screen } from "tests/testSetup";

const defaultContext = {
  version: "1.0.0",
  quitAndInstall: jest.fn(),
  downloadProgress: 42,
  setStatus: jest.fn(),
  error: null,
};

describe("UpdaterTopBanner", () => {
  it.each(VISIBLE_STATUS)("should render TopBanner for status '%s'", status => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: status as UpdateStatus,
    };
    render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );
    expect(screen.queryByTestId("layout-app-update-banner")).toBeInTheDocument();
  });

  it("should not render TopBanner for unknown status", () => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: "unknown-status" as UpdateStatus,
    };
    render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );
    expect(screen.queryByTestId("layout-app-update-banner")).not.toBeInTheDocument();
  });

  it("should not render TopBanner if context is missing version", () => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: "download-progress",
      quitAndInstall: jest.fn(),
      downloadProgress: 42,
      version: undefined,
    };
    render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );
    expect(screen.queryByTestId("layout-app-update-banner")).not.toBeInTheDocument();
  });

  it.each([
    ["check-success", "update.quitAndInstall"],
    ["error", "update.reDownload"],
  ])("should render a clickable element in right for status '%s'", (status, matcherOrKey) => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: status as UpdateStatus,
    };
    const { i18n } = render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );

    expect(screen.getByText(i18n.t(matcherOrKey))).toBeInTheDocument();
  });

  it("should render the right progress text for status 'download-progress'", () => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: "download-progress",
      downloadProgress: 42,
    };
    render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );
    expect(screen.getByText(/42% completed/)).toBeInTheDocument();
  });

  it("should update the banner text when language changes", async () => {
    const context: MaybeUpdateContextType = {
      ...defaultContext,
      status: "update-available",
    };
    const { i18n } = render(
      <UpdaterContext.Provider value={context}>
        <UpdaterTopBanner />
      </UpdaterContext.Provider>,
    );

    expect(
      screen.getByText(`Update to Ledger Wallet version ${context.version} is available`),
    ).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage("fr");
    });

    expect(
      screen.getByText(`Mise à jour disponible vers la version Ledger Wallet ${context.version}`),
    ).toBeInTheDocument();
  });
});
