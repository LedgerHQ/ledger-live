import React from "react";
import { Linking } from "react-native";
import { render, screen, userEvent } from "@tests/test-renderer";
import StepOnboard from "../components/StepOnboard";

jest.mock("LLM/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

describe("StepOnboard", () => {
  const onAgree = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the acknowledgement title", () => {
    render(<StepOnboard onAgree={onAgree} />);
    expect(screen.getByText("Acknowledgement")).toBeDefined();
  });

  it("should render all four warning items", () => {
    render(<StepOnboard onAgree={onAgree} />);
    expect(screen.getByText(/No address verification/)).toBeDefined();
    expect(screen.getByText(/separate seed/)).toBeDefined();
    expect(screen.getByText(/redirected outside Ledger Live/)).toBeDefined();
    expect(screen.getByText(/Transaction signing stays secure/)).toBeDefined();
  });

  it("should render learn more link", () => {
    render(<StepOnboard onAgree={onAgree} />);
    expect(screen.getByText("Learn more")).toBeDefined();
  });

  it("should call onAgree when Agree button is pressed", async () => {
    render(<StepOnboard onAgree={onAgree} />);

    await userEvent.press(screen.getByText("Agree"));

    expect(onAgree).toHaveBeenCalledTimes(1);
  });

  it("should open learn more URL when tapped", async () => {
    const spy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    render(<StepOnboard onAgree={onAgree} />);

    await userEvent.press(screen.getByText("Learn more"));

    expect(spy).toHaveBeenCalledWith("https://support.ledger.com/article/Concordium-CCD");
  });
});
