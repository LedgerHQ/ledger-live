import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { Card } from "../Card";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const liveAppFace = withFlagOverrides({
  lwdPayTab: { enabled: true, params: { card_native: false, card_live_app: true } },
});

async function openLoginIntro() {
  const view = render(<Card />, { initialRoute: "/paytab", initialState: liveAppFace });
  await view.user.click(await screen.findByRole("button", { name: "Get card" }));
  return view;
}

describe("RightPanel card live app face", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open the card program providers list from Create an account", async () => {
    const { user } = await openLoginIntro();

    await user.click(await screen.findByRole("button", { name: "Create an account" }));

    expect(mockNavigate).toHaveBeenCalledWith("/card/card-program?path=%2Fproviders-list", {
      state: { fromPayTab: true },
    });
  });

  it("should open the Baanx live app from Log in", async () => {
    const { user } = await openLoginIntro();

    await user.click(await screen.findByRole("button", { name: "Log in to Monavate" }));

    expect(mockNavigate).toHaveBeenCalledWith("/card/cl-card", { state: { fromPayTab: true } });
  });
});
