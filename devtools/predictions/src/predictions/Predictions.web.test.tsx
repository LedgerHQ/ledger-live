import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Predictions from "./Predictions";
import type { PredictionsToolProps } from "../types";

const ADDRESS = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const OTHER_ADDRESS = "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A";

function renderTool(props: Partial<PredictionsToolProps> = {}) {
  const toolProps: PredictionsToolProps = {
    hasSeenIntro: true,
    setIntroSeen: jest.fn(),
    onboardingStates: [
      {
        manifestId: "predictions-live-app",
        label: "Production",
        isStored: true,
        acceptedVersions: { terms: "1", disclaimer: "1" },
        addresses: [
          { address: ADDRESS, isActive: true, isBound: true },
          { address: OTHER_ADDRESS, isActive: false, isBound: false },
        ],
        raw: '{"version":1}',
      },
      {
        manifestId: "predictions-live-app-stg",
        label: "Staging",
        isStored: false,
        acceptedVersions: {},
        addresses: [],
        raw: undefined,
      },
    ],
    refresh: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
    replayWholeOnboarding: jest.fn(() => Promise.resolve()),
    setupFailureReasons: ["failed-deploy", "unknown"],
    previewSetup: jest.fn(),
    ...props,
  };
  render(<Predictions {...toolProps} />);
  return toolProps;
}

const environment = (name: string) =>
  screen.getByRole("heading", { name: new RegExp(name) }).closest("section") as HTMLElement;
const buttonIn = (section: HTMLElement, name: string) =>
  [...section.querySelectorAll("button")].find(button => button.textContent === name);

describe("Predictions.web", () => {
  it("shows the intro and everything each environment stored", () => {
    renderTool();

    expect(screen.getByText("Intro: seen")).toBeVisible();
    expect(screen.getByText("Documents: terms v1, disclaimer v1")).toBeVisible();
    expect(screen.getByText(`${ADDRESS} · active · bound`)).toBeVisible();
    expect(screen.getByText(`${OTHER_ADDRESS} · not bound`)).toBeVisible();
    expect(screen.getByText("Nothing stored: the next open is a first open.")).toBeVisible();
  });

  it("offers only the resets each environment can use", async () => {
    renderTool();

    await waitFor(() =>
      expect(buttonIn(environment("Production"), "Unbind the active account")).toBeEnabled(),
    );
    expect(buttonIn(environment("Staging"), "Forget everything")).toBeDisabled();
  });

  it("lets an unreadable stored value be forgotten", async () => {
    renderTool({
      onboardingStates: [
        {
          manifestId: "predictions-live-app-stg",
          label: "Staging",
          isStored: false,
          acceptedVersions: {},
          addresses: [],
          raw: "{not json",
        },
      ],
    });

    await waitFor(() =>
      expect(buttonIn(environment("Staging"), "Forget everything")).toBeEnabled(),
    );
  });

  it("forgets what's asked in one environment and says what comes back", async () => {
    const { reset } = renderTool();

    await userEvent.click(
      buttonIn(environment("Production"), "Unbind the active account") as HTMLElement,
    );

    expect(reset).toHaveBeenCalledWith("predictions-live-app", "binding");
    expect(
      await screen.findByText(
        "Done. Reopen Predictions on Production: it asks to sign the binding again, without the account picker.",
      ),
    ).toBeVisible();
  });

  it("replays the whole onboarding", async () => {
    const { replayWholeOnboarding } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: "Replay the whole onboarding" }));

    expect(replayWholeOnboarding).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText("Done. Reopen Predictions to replay the whole onboarding."),
    ).toBeVisible();
  });

  it("shows the intro again", async () => {
    const { setIntroSeen } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: "Show the intro again" }));

    expect(setIntroSeen).toHaveBeenCalledWith(false);
  });

  it("previews the trading wallet setup, loading or with an outcome", async () => {
    const { previewSetup } = renderTool();

    await userEvent.click(screen.getByRole("button", { name: "Loading" }));
    await userEvent.click(screen.getByRole("button", { name: "Failed: failed-deploy" }));

    expect(previewSetup).toHaveBeenNthCalledWith(1, undefined);
    expect(previewSetup).toHaveBeenNthCalledWith(2, { outcome: "failed", reason: "failed-deploy" });
  });

  it("reads what each environment stored on open, and says why it couldn't", async () => {
    const { refresh } = renderTool({
      refresh: jest.fn(() => Promise.reject(new Error("storage unavailable"))),
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Failed: storage unavailable")).toBeVisible();
  });

  it("copies the stored value", async () => {
    const writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderTool();

    await userEvent.click(screen.getByText("Stored value"));
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith('{"version":1}');
  });

  it("says why an action failed", async () => {
    renderTool({ reset: () => Promise.reject(new Error("storage unavailable")) });

    await userEvent.click(buttonIn(environment("Production"), "Forget everything") as HTMLElement);

    expect(await screen.findByText("Failed: storage unavailable")).toBeVisible();
  });
});
