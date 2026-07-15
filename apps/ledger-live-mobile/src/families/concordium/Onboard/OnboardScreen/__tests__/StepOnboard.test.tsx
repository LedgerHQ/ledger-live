import React from "react";
import { Linking } from "react-native";
import { render, screen, userEvent } from "@tests/test-renderer";
import StepOnboard from "../components/StepOnboard";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

describe("StepOnboard", () => {
  const onAgree = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the acknowledgement title", () => {
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);
    expect(screen.getByText("Acknowledgement")).toBeDefined();
  });

  it("should render all three warning items with bold titles", () => {
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);
    expect(screen.getByText(/separate seed/)).toBeDefined();
    expect(screen.getByText(/redirected outside Ledger Live/)).toBeDefined();
    expect(screen.getByText(/Transaction signing stays secure/)).toBeDefined();
  });

  it("should render learn more link with guide text", () => {
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);
    expect(screen.getByText("Please read the guide before proceeding:")).toBeDefined();
    expect(screen.getByText("Learn more")).toBeDefined();
  });

  it("should call onAgree when Agree button is pressed", async () => {
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);

    await userEvent.press(screen.getByText("Agree"));

    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when Cancel button is pressed", async () => {
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);

    await userEvent.press(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("should open learn more URL when tapped", async () => {
    const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    render(<StepOnboard onAgree={onAgree} onCancel={onCancel} />);

    await userEvent.press(screen.getByText("Learn more"));

    expect(spy).toHaveBeenCalledWith("https://support.ledger.com/article/Concordium-CCD");
  });
});
