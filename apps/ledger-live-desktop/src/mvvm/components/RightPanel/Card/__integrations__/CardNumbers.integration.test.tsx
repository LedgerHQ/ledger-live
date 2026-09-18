import React from "react";
import { mockPayCardDetailsToken } from "@domain/api-card-management/mock/card-details-token";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { act, render, screen } from "tests/testSetup";
import { Card } from "../Card";

const CARD_DETAILS_TOKEN_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/card/details/token`;
const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

describe("Card numbers", () => {
  beforeEach(() => {
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, () => HttpResponse.json(mockPayCardDetailsToken())),
    );
  });

  it("should show the card numbers once the user clicks View", async () => {
    const { user } = render(<Card />, { initialState: signedIn });

    await user.click(await screen.findByRole("button", { name: "View" }));

    const image = await screen.findByRole("img", { name: "Card numbers", hidden: true });
    jest.useFakeTimers();
    try {
      await act(async () => {
        image.dispatchEvent(new Event("load"));
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });
    } finally {
      jest.useRealTimers();
    }

    expect(screen.getByRole("img", { name: "Card numbers" })).toBeVisible();
  });

  it("should hide the card numbers again once the user clicks Hide", async () => {
    const { user } = render(<Card />, { initialState: signedIn });

    await user.click(await screen.findByRole("button", { name: "View" }));
    const image = await screen.findByRole("img", { name: "Card numbers", hidden: true });
    jest.useFakeTimers();
    try {
      await act(async () => {
        image.dispatchEvent(new Event("load"));
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });
    } finally {
      jest.useRealTimers();
    }
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
  });
});
