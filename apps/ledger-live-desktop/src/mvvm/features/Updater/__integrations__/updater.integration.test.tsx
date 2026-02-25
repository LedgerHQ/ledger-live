import React from "react";
import { render, screen } from "tests/testSetup";
import { UpdaterContext, UpdaterContextType } from "~/renderer/components/Updater/UpdaterContext";
import { openURL } from "~/renderer/linking";
import Updater from "../index";
import { defaultContext } from "../__tests__/helpers";
import { urls } from "~/config/urls";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

const renderWithContext = (overrides: Partial<UpdaterContextType> = {}) =>
  render(
    <UpdaterContext.Provider value={{ ...defaultContext, ...overrides }}>
      <Updater />
    </UpdaterContext.Provider>,
  );

describe("Updater", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing when status is idle", () => {
    const { container } = renderWithContext({ status: "idle" });
    expect(container.firstChild).toBeNull();
  });

  it("should render 'New update available' button when update-available", () => {
    renderWithContext({ status: "update-available" });

    const button = screen.getByRole("button", { name: /new update available/i });
    expect(button).toBeVisible();
  });

  it("should render progress percentage when downloading", () => {
    renderWithContext({ status: "download-progress", downloadProgress: 12 });

    const button = screen.getByRole("button", { name: /12%/i });
    expect(button).toBeVisible();
  });

  it("should render error button when status is error", () => {
    renderWithContext({ status: "error" });

    const button = screen.getByRole("button", { name: /error during update, try again/i });
    expect(button).toBeVisible();
  });

  it("should render 'Install update and relaunch' when check-success", () => {
    renderWithContext({ status: "check-success" });

    const button = screen.getByRole("button", { name: /install update and relaunch/i });
    expect(button).toBeVisible();
  });

  it("should call quitAndInstall when clicking install button", async () => {
    const quitAndInstall = jest.fn();
    const { user } = renderWithContext({ status: "check-success", quitAndInstall });

    const button = screen.getByRole("button", { name: /install update and relaunch/i });
    await user.click(button);
    expect(quitAndInstall).toHaveBeenCalledTimes(1);
  });

  it("should open re-download url when clicking error button", async () => {
    const { user } = renderWithContext({ status: "error" });

    const button = screen.getByRole("button", { name: /error during update, try again/i });
    await user.click(button);
    expect(openURL).toHaveBeenCalledWith(urls.liveHome);
  });
});
