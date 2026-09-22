import React from "react";
import {
  mockPayCardStatus,
  mockPayCardUser,
} from "@domain/api-card-management/mock/card-onboarding-status";
import { http, HttpResponse, server } from "tests/server";
import { render, screen } from "tests/testSetup";
import { Card } from "../Card";

const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

const mockOpenHostedPage = jest.fn().mockResolvedValue(undefined);
const mockOpenURL = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => jest.fn(),
}));

jest.mock("../useCardHostedPageOpeners", () => ({
  useCardHostedPageOpeners: () => ({
    openHostedLogin: jest.fn(),
    openHostedPage: mockOpenHostedPage,
  }),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: (...args: unknown[]) => mockOpenURL(...args),
}));

jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  readCardUsEnv: jest.fn().mockResolvedValue(false),
}));

describe("Card settings actions", () => {
  beforeEach(() => {
    mockOpenHostedPage.mockClear();
    mockOpenURL.mockClear();
    server.use(
      http.get("*/v1/card/status", () => HttpResponse.json(mockPayCardStatus())),
      http.get("*/v1/user", () => HttpResponse.json(mockPayCardUser(true))),
    );
  });

  it("forwards the manage PIN action from CardView into the rendered More menu", async () => {
    const { user } = render(<Card />, { initialState: signedIn });

    await user.click(await screen.findByTestId("more-tile"));
    await user.click(await screen.findByTestId("more-row-managePin"));

    expect(mockOpenHostedPage).toHaveBeenCalledWith("/set-pin");
  });

  it("forwards the access Baanx action from CardView into the rendered More menu", async () => {
    const { user } = render(<Card />, { initialState: signedIn });

    await user.click(await screen.findByTestId("more-tile"));
    await user.click(await screen.findByTestId("more-row-accessBaanx"));

    expect(mockOpenHostedPage).toHaveBeenCalledWith("/");
  });

  it("forwards the help action from CardView into the rendered More menu", async () => {
    const { user } = render(<Card />, { initialState: signedIn });

    await user.click(await screen.findByTestId("more-tile"));
    await user.click(await screen.findByTestId("more-row-help"));

    expect(mockOpenURL).toHaveBeenCalledWith("https://support.ledger.com/article/5283612250653-zd");
  });
});
