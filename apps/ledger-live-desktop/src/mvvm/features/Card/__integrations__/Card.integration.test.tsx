import React from "react";
import { render, screen } from "tests/testSetup";
import { useNavigate } from "react-router";
import CardPage from "..";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

describe("Card feature integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should render Card page with header and main content", () => {
    render(<CardPage />);

    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Spend your crypto")).toBeInTheDocument();
    expect(screen.getByText("Pay online or in store with a crypto card")).toBeInTheDocument();
  });

  it("should display hero section when Card page is rendered", () => {
    render(<CardPage />);

    expect(screen.getByText("Unlock liquidity")).toBeVisible();
    expect(
      screen.getByText(/Explore our crypto cards and find the one that suits you best/),
    ).toBeVisible();
    expect(screen.getByRole("img", { name: /card image/i })).toBeVisible();
  });

  it("should render Explore Cards and I already have a card buttons", () => {
    render(<CardPage />);

    expect(screen.getByRole("button", { name: "Explore Cards" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I already have a card" })).toBeInTheDocument();
  });

  it("should navigate to card-program providers list when clicking Explore Cards", async () => {
    const { user } = render(<CardPage />);

    await user.click(screen.getByRole("button", { name: "Explore Cards" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/card/card-program?path=%2Fproviders-list", {
      state: { fromCardLanding: true },
    });
  });

  it("should navigate to cl-card when clicking I already have a card", async () => {
    const { user } = render(<CardPage />);

    await user.click(screen.getByRole("button", { name: "I already have a card" }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/card/cl-card", {
      state: { fromCardLanding: true },
    });
  });
});
