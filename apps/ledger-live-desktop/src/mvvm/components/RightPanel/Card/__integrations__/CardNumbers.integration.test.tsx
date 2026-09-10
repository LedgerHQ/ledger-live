import React from "react";
import { mockPayCardDetailsToken } from "@domain/api-card-management/mock/card-details-token";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { render, screen } from "tests/testSetup";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { Card } from "../Card";

jest.mock("~/renderer/storage", () => ({
  setEncryptionKey: jest.fn(),
  isEncryptionKeyCorrect: jest.fn(),
}));

const CARD_DETAILS_TOKEN_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/card/details/token`;
const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

describe("Card numbers unlock", () => {
  const setEncryptionKeyMock = jest.mocked(setEncryptionKey);
  const isEncryptionKeyCorrectMock = jest.mocked(isEncryptionKeyCorrect);

  beforeEach(() => {
    setEncryptionKeyMock.mockResolvedValue(undefined);
    isEncryptionKeyCorrectMock.mockResolvedValue(true);
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, () => HttpResponse.json(mockPayCardDetailsToken())),
    );
  });

  it("should show the card numbers once the user sets a password", async () => {
    const { user } = render(<Card />, {
      initialState: { ...signedIn, application: { hasPassword: false } },
    });

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(setEncryptionKeyMock).toHaveBeenCalledWith("secret");
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();
  });

  it("should show the card numbers once the user enters their password", async () => {
    const { user } = render(<Card />, {
      initialState: { ...signedIn, application: { hasPassword: true } },
    });

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(isEncryptionKeyCorrectMock).toHaveBeenCalledWith("secret");
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();
  });

  it("should not reveal the card numbers when the user cancels the password dialog", async () => {
    const { user } = render(<Card />, {
      initialState: { ...signedIn, application: { hasPassword: true } },
    });

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(isEncryptionKeyCorrectMock).not.toHaveBeenCalled();
  });

  it("should hide the card numbers again once the user clicks Hide", async () => {
    const { user } = render(<Card />, {
      initialState: { ...signedIn, application: { hasPassword: true } },
    });

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
  });
});
