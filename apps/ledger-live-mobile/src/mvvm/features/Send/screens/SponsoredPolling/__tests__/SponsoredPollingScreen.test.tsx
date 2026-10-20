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
      title: "Your energy is being delivered",
      message: "This usually takes up to 30 seconds.",
      elapsedLabel: "Elapsed: 00:05",
    });

    render(<SponsoredPollingScreen />);

    expect(screen.getByTestId("send-sponsored-polling")).toBeOnTheScreen();
    expect(screen.getByText("Your energy is being delivered")).toBeOnTheScreen();
    expect(screen.getByText("This usually takes up to 30 seconds.")).toBeOnTheScreen();
    expect(screen.getByText("Elapsed: 00:05")).toBeOnTheScreen();
  });
});
