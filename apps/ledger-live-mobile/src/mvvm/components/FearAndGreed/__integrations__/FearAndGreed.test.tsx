import React from "react";
import { render, screen } from "@tests/test-renderer";
import { FearAndGreed } from "../index";
import { server } from "@tests/server";
import { http, HttpResponse } from "msw";

const API_ENDPOINT = "https://proxycmc.api.live.ledger.com/v3/fear-and-greed/latest";

const createMockResponse = (value: number, classification: string) => ({
  data: {
    value,
    value_classification: classification,
    update_time: "2026-01-14T12:00:00Z",
  },
  status: {
    timestamp: "2026-01-14T12:00:00Z",
    error_code: 0,
    error_message: "",
    elapsed: 10,
    credit_count: 1,
  },
});

// REACT19: Skipped until @ledgerhq/lumen-ui-rnative is fully compatible with React 19 test renderer
describe.skip("FearAndGreed Integration", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  describe("Error states", () => {
    it("should render nothing when API fails", () => {
      server.use(http.get(API_ENDPOINT, () => new HttpResponse(null, { status: 500 })));

      const { queryByTestId } = render(<FearAndGreed />);

      expect(queryByTestId("fear-and-greed-card")).toBeNull();
    });
  });

  describe("Mood levels", () => {
    it.each([
      { value: 15, label: "Fear+", classification: "Extreme Fear" },
      { value: 45, label: "Fear", classification: "Fear" },
      { value: 50, label: "Neutral", classification: "Neutral" },
      { value: 70, label: "Greed", classification: "Greed" },
      { value: 90, label: "Greed+", classification: "Extreme Greed" },
    ])("should render $label when value is $value", async ({ value, label, classification }) => {
      server.use(
        http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(value, classification))),
      );

      render(<FearAndGreed />);

      expect(await screen.findByText(label)).toBeVisible();
    });
  });
  describe("Drawer interaction", () => {
    it("should open definition drawer when card is pressed", async () => {
      server.use(
        http.get(API_ENDPOINT, () => HttpResponse.json(createMockResponse(50, "Neutral"))),
      );

      const { user } = render(<FearAndGreed />);

      const card = await screen.findByText("Neutral");
      await user.press(card);

      expect(
        screen.getByText(/the mood index indicates the emotional state of the market/i),
      ).toBeVisible();
    });
  });
});
