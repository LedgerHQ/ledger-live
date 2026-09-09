import React from "react";
import { render, screen } from "@testing-library/react";
import { WebTestWrapper } from "../../__tests__/webTestWrapper";
import { More } from "./More";
import { useMoreViewModel } from "./useMoreViewModel";
import { buildMoreViewProps } from "./fixtures";

jest.mock("./useMoreViewModel", () => ({ useMoreViewModel: jest.fn() }));

const more = buildMoreViewProps();

describe("More (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while the view model has nothing to show", () => {
    jest.mocked(useMoreViewModel).mockReturnValue(null);

    render(<More />, { wrapper: WebTestWrapper });

    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("renders the More tile once the view model is ready", () => {
    jest.mocked(useMoreViewModel).mockReturnValue(more);

    render(<More />, { wrapper: WebTestWrapper });

    expect(screen.getByRole("button", { name: "More" })).toBeVisible();
  });
});
