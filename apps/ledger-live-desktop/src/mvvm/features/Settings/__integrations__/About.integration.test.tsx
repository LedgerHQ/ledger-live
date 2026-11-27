import React from "react";
import { Route, Routes } from "react-router";
import { LinkingProvider } from "@shared/linking";
import { SettingsRoute } from "LLD/features/Settings";
import { urls } from "~/config/urls";
import { render, screen, withFlagOverrides } from "tests/testSetup";

const mockPushToast = jest.fn();

jest.mock("@ledgerhq/live-common/notifications/ToastProvider/index", () => ({
  useToasts: () => ({ pushToast: mockPushToast }),
}));

type RenderAboutOptions = Readonly<{ isFlagEnabled?: boolean; developerMode?: boolean }>;

function renderAbout({ isFlagEnabled = true, developerMode = false }: RenderAboutOptions = {}) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <Routes>
        <Route
          path="/settings/*"
          element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
        />
      </Routes>
    </LinkingProvider>,
    {
      initialRoute: "/settings/about",
      initialState: {
        ...withFlagOverrides({ newSettings: { enabled: isFlagEnabled } }),
        settings: { developerMode },
      },
    },
  );
  return { ...rendered, openExternal };
}

async function tapVersion(user: ReturnType<typeof renderAbout>["user"], times: number) {
  const version = screen.getByTestId("settings-about-version");
  for (let tap = 0; tap < times; tap++) await user.click(version);
}

beforeEach(() => {
  mockPushToast.mockClear();
});

describe("About section with newSettings on", () => {
  it("shows the version, the terms and the social links", () => {
    renderAbout();

    expect(screen.getByTestId("settings-about")).toBeInTheDocument();
    expect(screen.getByTestId("settings-about-version")).toBeInTheDocument();
    expect(screen.getByText("Connect with us")).toBeInTheDocument();
    expect(screen.queryByText("Legacy settings")).not.toBeInTheDocument();
  });

  it("opens the terms and the social links", async () => {
    const { user, openExternal } = renderAbout();

    await user.click(screen.getByTestId("settings-about-terms"));
    await user.click(screen.getByTestId("settings-about-x"));
    await user.click(screen.getByTestId("settings-about-instagram"));
    await user.click(screen.getByTestId("settings-about-github"));

    expect(openExternal.mock.calls).toEqual([
      [urls.terms],
      [urls.social.twitter],
      [urls.social.instagram],
      [urls.social.github],
    ]);
  });

  it("keeps the developer mode off until the fifth tap of the version", async () => {
    const { user, store } = renderAbout();

    await tapVersion(user, 4);

    expect(store.getState().settings.developerMode).toBe(false);
    expect(mockPushToast).not.toHaveBeenCalled();
  });

  it("turns the developer mode on and shows the toast on the fifth tap of the version", async () => {
    const { user, store } = renderAbout();

    await tapVersion(user, 5);

    expect(store.getState().settings.developerMode).toBe(true);
    expect(mockPushToast).toHaveBeenCalledTimes(1);
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "achievement",
        title: "You are now a developer !",
        text: "Welcome to wonderland",
      }),
    );
  });

  it("does nothing more on the taps after the fifth", async () => {
    const { user, store } = renderAbout();

    await tapVersion(user, 6);

    expect(store.getState().settings.developerMode).toBe(true);
    expect(mockPushToast).toHaveBeenCalledTimes(1);
  });

  it("shows no toast when the developer mode is already on", async () => {
    const { user, store } = renderAbout({ developerMode: true });

    await tapVersion(user, 5);

    expect(store.getState().settings.developerMode).toBe(true);
    expect(mockPushToast).not.toHaveBeenCalled();
  });
});

describe("About section with newSettings off", () => {
  it("keeps the legacy Settings", () => {
    renderAbout({ isFlagEnabled: false });

    expect(screen.getByText("Legacy settings")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-about")).not.toBeInTheDocument();
  });
});
