import React from "react";
import { render, screen } from "@testing-library/react-native";
import { More } from "./More";
import { useMoreViewModel } from "./useMoreViewModel";
import { buildMoreViewProps } from "./fixtures";

jest.mock("./useMoreViewModel", () => ({ useMoreViewModel: jest.fn() }));

const more = buildMoreViewProps();

describe("More (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while the view model has nothing to show", () => {
    jest.mocked(useMoreViewModel).mockReturnValue(null);

    const { toJSON } = render(<More />);

    expect(toJSON()).toBeNull();
  });

  it("renders the More tile once the view model is ready", () => {
    jest.mocked(useMoreViewModel).mockReturnValue(more);

    render(<More />);

    expect(screen.getByTestId("more-tile")).toBeVisible();
  });
});
