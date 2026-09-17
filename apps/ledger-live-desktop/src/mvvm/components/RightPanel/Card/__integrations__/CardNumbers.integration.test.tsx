import React from "react";
import { mockPayCardDetailsToken } from "@domain/api-card-management/mock/card-details-token";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { Card } from "../Card";

jest.mock("~/renderer/storage", () => ({
  setEncryptionKey: jest.fn(),
  isEncryptionKeyCorrect: jest.fn(),
}));

const CARD_DETAILS_TOKEN_URL = `${getEnv("CARD_BAANX_API_URL")}/v1/card/details/token`;
const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

function renderCard(hasPassword: boolean) {
  return render(<Card />, {
    initialState: { ...signedIn, application: { hasPassword } },
  });
}

async function revealCardNumbers() {
  const image = await screen.findByRole("img", { name: "Card numbers", hidden: true });
  fireEvent.load(image);
  expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();
  expect(await screen.findByRole("button", { name: "Hide" }, { timeout: 1500 })).toBeVisible();
}

describe("Card numbers unlock", () => {
  const setEncryptionKeyMock = jest.mocked(setEncryptionKey);
  const isEncryptionKeyCorrectMock = jest.mocked(isEncryptionKeyCorrect);

  beforeEach(() => {
    jest.clearAllMocks();
    setEncryptionKeyMock.mockResolvedValue(undefined);
    isEncryptionKeyCorrectMock.mockResolvedValue(true);
    server.use(
      http.post(CARD_DETAILS_TOKEN_URL, () => HttpResponse.json(mockPayCardDetailsToken())),
    );
  });

  it("should show the card numbers once the user sets a password", async () => {
    const { user } = renderCard(false);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(setEncryptionKeyMock).toHaveBeenCalledWith("secret");
    await revealCardNumbers();
  });

  it("should show the card numbers once the user enters their password", async () => {
    let finishCheck: ((ok: boolean) => void) | undefined;
    isEncryptionKeyCorrectMock.mockImplementation(
      () =>
        new Promise(resolve => {
          finishCheck = resolve;
        }),
    );
    const { user } = renderCard(true);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByLabelText("Current password")).toBeDisabled();

    await act(async () => {
      finishCheck?.(true);
    });

    expect(isEncryptionKeyCorrectMock).toHaveBeenCalledWith("secret");
    await revealCardNumbers();
  });

  it("should ask for a password when Save is empty", async () => {
    const { user } = renderCard(false);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("button", { name: "Save" }));

    expect(screen.getByText("Password required")).toBeVisible();
    expect(setEncryptionKeyMock).not.toHaveBeenCalled();
  });

  it("should ask the user to match both passwords when they differ", async () => {
    const { user } = renderCard(false);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "other");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Passwords don't match")).toBeVisible();
    expect(setEncryptionKeyMock).not.toHaveBeenCalled();
  });

  it("should keep the card hidden when the password is wrong", async () => {
    isEncryptionKeyCorrectMock.mockResolvedValue(false);
    const { user } = renderCard(true);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(screen.getByText("Incorrect password")).toBeVisible();
    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
  });

  it("should not reveal the card numbers when the user cancels the password dialog", async () => {
    const { user } = renderCard(true);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(isEncryptionKeyCorrectMock).not.toHaveBeenCalled();
  });

  it("should hide the card numbers again once the user clicks Hide", async () => {
    const { user } = renderCard(true);

    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await revealCardNumbers();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
  });
});
