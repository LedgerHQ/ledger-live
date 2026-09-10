import React from "react";
import { getMockCardOnboardingStatus } from "@domain/api-card-management/mock";
import { cardSession } from "@features/platform-card";
import { render, screen } from "tests/testSetup";
import { http, HttpResponse, server } from "tests/server";
import { isEncryptionKeyCorrect, setEncryptionKey } from "~/renderer/storage";
import { Card } from "../Card";

jest.mock("~/renderer/storage", () => ({
  setEncryptionKey: jest.fn(),
  isEncryptionKeyCorrect: jest.fn(),
}));

const TOKEN = "00000000-0000-4000-8000-000000000000";
const IMAGE_URL = `https://card.test/details-image?token=${TOKEN}`;

const CARD_STATUS = {
  id: "card-1",
  panLast4: "4242",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2026-01-01T00:00:00.000Z",
};

const CARD_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  verificationState: "VERIFIED",
};

function mockCardApi() {
  server.use(
    http.get("*/v1/user", () => HttpResponse.json(CARD_USER)),
    http.get("*/v1/card/status", () => HttpResponse.json(CARD_STATUS)),
    http.get("*/v1/card/onboarding-status", () => HttpResponse.json(getMockCardOnboardingStatus())),
    http.post("*/v1/card/details/token", () =>
      HttpResponse.json({
        token: TOKEN,
        imageUrl: IMAGE_URL,
      }),
    ),
  );
}

describe("Card numbers", () => {
  const setEncryptionKeyMock = jest.mocked(setEncryptionKey);
  const isEncryptionKeyCorrectMock = jest.mocked(isEncryptionKeyCorrect);

  beforeEach(async () => {
    setEncryptionKeyMock.mockResolvedValue(undefined);
    isEncryptionKeyCorrectMock.mockResolvedValue(true);
    mockCardApi();
    await cardSession.set({ accessToken: "at_token", refreshToken: "rt_token" });
  });

  afterEach(async () => {
    await cardSession.clear();
  });

  it("should show the card image after the user sets a password", async () => {
    const { user, store } = render(<Card />, {
      initialState: {
        application: { hasPassword: false },
        payCardAuth: { isSignedIn: true, hasCard: true },
      },
    });

    await screen.findByTestId("more-tile");
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Freeze" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(setEncryptionKeyMock).toHaveBeenCalledWith("secret");
    expect(await screen.findByRole("img", { name: "Card numbers" })).toHaveAttribute(
      "src",
      IMAGE_URL,
    );
    expect(JSON.stringify(store.getState().cardApi)).not.toContain(TOKEN);
  });

  it("should show the card image after the user enters their password", async () => {
    const { user } = render(<Card />, {
      initialState: {
        application: { hasPassword: true },
        payCardAuth: { isSignedIn: true, hasCard: true },
      },
    });

    await screen.findByTestId("more-tile");
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(isEncryptionKeyCorrectMock).toHaveBeenCalledWith("secret");
    expect(await screen.findByRole("img", { name: "Card numbers" })).toHaveAttribute(
      "src",
      IMAGE_URL,
    );
  });

  it("should keep the dialog open when Cancel is clicked while saving the password", async () => {
    let resolveSave: (() => void) | undefined;
    setEncryptionKeyMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSave = () => resolve(undefined);
        }),
    );
    const { user } = render(<Card />, {
      initialState: {
        application: { hasPassword: false },
        payCardAuth: { isSignedIn: true, hasCard: true },
      },
    });

    await screen.findByTestId("more-tile");
    await user.click(screen.getByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("New password"), "secret");
    await user.type(screen.getByLabelText("Confirm password"), "secret");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByTestId("card-numbers-unlock-dialog")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("card-numbers-unlock-dialog")).toBeVisible();

    resolveSave?.();
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();
  });

  it("should not load card numbers when the user clicks Cancel", async () => {
    let minted = false;
    server.use(
      http.post("*/v1/card/details/token", () => {
        minted = true;
        return HttpResponse.json({ token: TOKEN, imageUrl: IMAGE_URL });
      }),
    );
    const { user } = render(<Card />, {
      initialState: {
        application: { hasPassword: true },
        payCardAuth: { isSignedIn: true, hasCard: true },
      },
    });

    await screen.findByTestId("more-tile");
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(minted).toBe(false);
  });

  it("should hide the card image when the user clicks Hide", async () => {
    const { user } = render(<Card />, {
      initialState: {
        application: { hasPassword: true },
        payCardAuth: { isSignedIn: true, hasCard: true },
      },
    });

    await screen.findByTestId("more-tile");
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.type(await screen.findByLabelText("Current password"), "secret");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("img", { name: "Card numbers" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.queryByRole("img", { name: "Card numbers" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
  });
});
