import React from "react";
import { render, screen } from "@tests/test-renderer";
import { SponsoredPollingScreen } from "../SponsoredPollingScreen";
import { useSponsoredPollingViewModel } from "../hooks/useSponsoredPollingViewModel";

jest.mock("../hooks/useSponsoredPollingViewModel", () => ({
  useSponsoredPollingViewModel: jest.fn(),
}));

describe("SponsoredPollingScreen", () => {
  it("shows what it waits for and for how long", () => {
    jest.mocked(useSponsoredPollingViewModel).mockReturnValue({
      title: "Waiting for energy delivery",
      message: "Provider is delivering the rented energy.",
      elapsedLabel: "Elapsed: 00:05",
    });

    render(<SponsoredPollingScreen />);

    expect(screen.getByTestId("send-sponsored-polling")).toBeOnTheScreen();
    expect(screen.getByText("Waiting for energy delivery")).toBeOnTheScreen();
    expect(screen.getByText("Provider is delivering the rented energy.")).toBeOnTheScreen();
    expect(screen.getByText("Elapsed: 00:05")).toBeOnTheScreen();
  });
});
