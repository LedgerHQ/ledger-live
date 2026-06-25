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
  it("should render the loading title when connect device is loading", () => {
    renderWithUser(<LoadingState />);

    expect(screen.getByText("Loading")).toBeVisible();
  });
});
