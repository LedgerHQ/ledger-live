import React from "react";
import { screen } from "@testing-library/react";

import { renderWithUser } from "../testUtils";
import { LoadingState } from "./LoadingState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

describe("LoadingState", () => {
  it("GIVEN connect device is loading WHEN rendering THEN it shows the loading title", () => {
    // WHEN
    renderWithUser(<LoadingState />);

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });
});
