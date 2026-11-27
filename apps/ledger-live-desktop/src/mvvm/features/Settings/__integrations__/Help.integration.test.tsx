import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { SettingsRoute } from "LLD/features/Settings";
import { urls } from "~/config/urls";
import { files } from "~/renderer/bridge";
import logger from "~/renderer/logger";
import { useHardReset, useSoftReset } from "~/renderer/reset";
import { render, screen, withFlagOverrides } from "tests/testSetup";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual<object>("@shared/analytics"),
  track: jest.fn(),
}));

jest.mock("~/renderer/reset", () => ({
  ...jest.requireActual<object>("~/renderer/reset"),
  useSoftReset: jest.fn(),
  useHardReset: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => {
  const { createElement } = jest.requireActual<typeof React>("react");
  return {
    ...jest.requireActual<object>("@ledgerhq/live-common/bridge/react/index"),
    SyncSkipUnderPriority: ({ priority }: Readonly<{ priority: number }>) =>
      createElement("span", { "data-testid": "sync-skip", "data-priority": priority }),
  };
});

jest.mock("~/renderer/modals/ResetFallbackModal", () => {
  const { createElement } = jest.requireActual<typeof React>("react");
  return {
    __esModule: true,
    default: ({ isOpened }: Readonly<{ isOpened: boolean }>) =>
      isOpened ? createElement("div", { "data-testid": "reset-fallback-modal" }) : null,
  };
});

function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="location">{pathname}</span>;
}

type FlagOverrides = Parameters<typeof withFlagOverrides>[0];

function renderHelp(flags: FlagOverrides = {}) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <Routes>
        <Route
          path="/settings/*"
          element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
        />
      </Routes>
      <LocationProbe />
    </LinkingProvider>,
    {
      initialRoute: "/settings/help",
      initialState: withFlagOverrides({ newSettings: { enabled: true }, ...flags }),
    },
  );
  return { ...rendered, openExternal };
}

const softReset = jest.fn();
const hardReset = jest.fn();

beforeEach(() => {
  softReset.mockReset().mockResolvedValue(undefined);
  hardReset.mockReset().mockResolvedValue(undefined);
  jest.mocked(useSoftReset).mockReturnValue(softReset);
  jest.mocked(useHardReset).mockReturnValue(hardReset);
  jest.mocked(track).mockClear();
  jest.mocked(files.openUserDataDirectory).mockClear();
  jest.spyOn(logger, "error").mockImplementation(() => undefined);
  jest.spyOn(logger, "critical").mockImplementation(() => undefined);
});

describe("Help page links", () => {
  it.each([
    ["no chatbot flag", {}, urls.faq],
    ["lldChatbotSupport", { lldChatbotSupport: { enabled: true } }, urls.chatbot],
    ["llmChatbotSupport", { llmChatbotSupport: { enabled: true } }, urls.chatbot],
  ])("opens the support page for %s", async (_, flags, expectedUrl) => {
    const { user, openExternal } = renderHelp(flags);

    await user.click(screen.getByTestId("settings-help-support"));

    expect(openExternal.mock.calls).toEqual([[expectedUrl]]);
  });

  it("opens the Academy and the status pages", async () => {
    const { user, openExternal } = renderHelp();

    await user.click(screen.getByTestId("settings-help-academy"));
    await user.click(screen.getByTestId("settings-help-status"));

    expect(openExternal.mock.calls).toEqual([
      [urls.helpModal.ledgerAcademy],
      [urls.helpModal.status],
    ]);
  });
});

describe("Help page actions", () => {
  it("opens the user data directory", async () => {
    const { user } = renderHelp();

    await user.click(screen.getByTestId("settings-help-viewUserData-button"));

    expect(files.openUserDataDirectory).toHaveBeenCalledTimes(1);
  });

  it("launches the onboarding", async () => {
    const { user } = renderHelp();

    await user.click(screen.getByTestId("settings-help-launchOnboarding-button"));

    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding");
  });

  it("launches the lazy onboarding when the wallet flag asks for it", async () => {
    const { user } = renderHelp({
      lwdWallet40: { enabled: true, params: { lazyOnboarding: true } },
    });

    await user.click(screen.getByTestId("settings-help-launchOnboarding-button"));

    expect(screen.getByTestId("location")).toHaveTextContent("/onboarding/select-device");
  });

  it("tracks the export of the logs", async () => {
    const { user } = renderHelp();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(track).toHaveBeenCalledWith("ExportLogs");
  });
});

describe.each([
  ["Clear cache", "clearCache", softReset, "ClearCacheIntent"],
  ["Reset", "resetApp", hardReset, "HardResetIntent"],
])("Help page %s", (_, id, action, intentEvent) => {
  it("runs only once the user confirms", async () => {
    const { user } = renderHelp();

    await user.click(screen.getByTestId(`settings-help-${id}-button`));
    expect(action).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(intentEvent);

    await user.click(screen.getByTestId("settings-help-confirm-button"));

    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("reset-fallback-modal")).not.toBeInTheDocument();
  });

  it("does not run when the user cancels", async () => {
    const { user } = renderHelp();

    await user.click(screen.getByTestId(`settings-help-${id}-button`));
    await user.click(screen.getByTestId("settings-help-cancel-button"));

    expect(action).not.toHaveBeenCalled();
  });

  it("pauses the sync while the confirmation is open", async () => {
    const { user } = renderHelp();
    expect(screen.queryByTestId("sync-skip")).not.toBeInTheDocument();

    await user.click(screen.getByTestId(`settings-help-${id}-button`));
    expect(screen.getByTestId("sync-skip")).toHaveAttribute("data-priority", "999");

    await user.click(screen.getByTestId("settings-help-cancel-button"));
    expect(screen.queryByTestId("sync-skip")).not.toBeInTheDocument();
  });

  it("opens the manual fallback when it fails", async () => {
    action.mockRejectedValue(new Error("cannot delete"));
    const { user } = renderHelp();

    await user.click(screen.getByTestId(`settings-help-${id}-button`));
    await user.click(screen.getByTestId("settings-help-confirm-button"));

    expect(await screen.findByTestId("reset-fallback-modal")).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
