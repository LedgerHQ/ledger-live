import React from "react";
import { screen } from "@testing-library/react";

import { renderWithUser } from "../testUtils";
import { UnknownErrorState } from "./UnknownErrorState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

describe("UnknownErrorState", () => {
  it("GIVEN an unexpected error escapes WHEN rendering THEN it shows the generic intent error copy", () => {
    // WHEN
    renderWithUser(<UnknownErrorState />);

    // THEN
    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
  });
});
