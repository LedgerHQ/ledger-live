import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFakeLinking } from "./__tests__/fakeLinking";
import {
  createFakeMobileSettingsAboutPort,
  createFakeSettingsAboutPort,
  FAKE_TERMS_URL,
} from "./__tests__/fakeSettingsAboutPort";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { SettingsAbout } from "./SettingsAbout";
import { socialUrls } from "./urls";

const { openExternal, LinkingWrapper } = createFakeLinking();

function renderAbout(port = createFakeSettingsAboutPort()) {
  render(
    <I18nWrapper>
      <LinkingWrapper>
        <SettingsAbout port={port} testID="settings-about" />
      </LinkingWrapper>
    </I18nWrapper>,
  );
  return { port, user: userEvent.setup() };
}

beforeEach(() => {
  openExternal.mockClear();
});

describe("SettingsAbout on desktop", () => {
  it("renders the section with its rows and wording", () => {
    renderAbout();

    expect(screen.getByTestId("settings-about")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("1.2.3")).toBeInTheDocument();
    expect(screen.getByText("Connect with us")).toBeInTheDocument();
    expect(screen.getByText("Follow us on X")).toBeInTheDocument();
    expect(screen.getByText("Follow us on Instagram")).toBeInTheDocument();
    expect(screen.getByText("Review our Github")).toBeInTheDocument();
  });

  it("opens the social and terms links", async () => {
    const { user } = renderAbout();

    await user.click(screen.getByTestId("settings-about-x"));
    await user.click(screen.getByTestId("settings-about-instagram"));
    await user.click(screen.getByTestId("settings-about-github"));
    await user.click(screen.getByTestId("settings-about-terms"));

    expect(openExternal.mock.calls).toEqual([
      [socialUrls.twitter],
      [socialUrls.instagram],
      [socialUrls.github],
      [FAKE_TERMS_URL],
    ]);
  });

  it("unlocks the developer tools after five taps on the version", async () => {
    const { user, port } = renderAbout();
    const version = screen.getByTestId("settings-about-version");

    for (let tap = 0; tap < 4; tap++) await user.click(version);
    expect(port.unlockDeveloperTools).not.toHaveBeenCalled();

    await user.click(version);
    expect(port.unlockDeveloperTools).toHaveBeenCalledTimes(1);
  });

  it("shows the feedback row and opens the feedback flow when the app provides it", async () => {
    const port = createFakeMobileSettingsAboutPort();
    const { user } = renderAbout(port);

    expect(screen.getByText("Give us feedback on the app")).toBeInTheDocument();

    await user.click(screen.getByTestId("settings-about-feedback"));
    expect(port.feedback).toHaveBeenCalledTimes(1);
  });
});
