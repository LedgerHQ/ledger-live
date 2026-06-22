import React from "react";
import { act, render, screen } from "tests/testSetup";
import Body from "../Body";
import { openURL } from "~/renderer/linking";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("UnstakeRequiredModal/Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders changeBaker title and description", () => {
    render(<Body onClose={jest.fn()} params={{ reason: "changeBaker" }} />);
    expect(screen.getByText("Unstake before changing baker")).toBeInTheDocument();
    expect(
      screen.getByText(/Unstake all your funds before delegating to a new baker/i),
    ).toBeInTheDocument();
  });

  it("renders endDelegation title and description", () => {
    render(<Body onClose={jest.fn()} params={{ reason: "endDelegation" }} />);
    expect(screen.getByText("Unstake before ending delegation")).toBeInTheDocument();
    expect(
      screen.getByText(/Unstake all your funds before ending the delegation/i),
    ).toBeInTheDocument();
  });

  it("renders all four step descriptions and numbered badges", () => {
    render(<Body onClose={jest.fn()} params={{ reason: "changeBaker" }} />);
    expect(screen.getByText(/Open the Tezos Account dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Unstake the MAX amount/i)).toBeInTheDocument();
    expect(screen.getByText(/Wait ~4 days/i)).toBeInTheDocument();
    expect(screen.getByText(/Once withdrawn/i)).toBeInTheDocument();
    [1, 2, 3, 4].forEach(n => {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    });
  });

  it("renders the Learn more link and Close button", () => {
    render(<Body onClose={jest.fn()} params={{ reason: "changeBaker" }} />);
    expect(screen.getByText(/Learn more about Tezos staking/i)).toBeInTheDocument();
    expect(screen.getByTestId("tezos-unstake-required-close-button")).toBeInTheDocument();
  });

  it("Close button forwards to onClose (Modal wrapper dispatches closeModal)", async () => {
    const onClose = jest.fn();
    const { user } = render(<Body onClose={onClose} params={{ reason: "changeBaker" }} />);

    await act(async () => {
      await user.click(screen.getByTestId("tezos-unstake-required-close-button"));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Learn more link calls openURL with the staking URL", async () => {
    const { user } = render(<Body onClose={jest.fn()} params={{ reason: "changeBaker" }} />);

    await act(async () => {
      await user.click(screen.getByText(/Learn more about Tezos staking/i));
    });

    expect(openURL).toHaveBeenCalledTimes(1);
    expect((openURL as jest.Mock).mock.calls[0][0]).toEqual(expect.stringMatching(/^https?:\/\//));
  });
});
