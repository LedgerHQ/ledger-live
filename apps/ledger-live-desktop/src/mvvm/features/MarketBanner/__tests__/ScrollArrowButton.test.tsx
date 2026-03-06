import React from "react";
import { render, screen } from "tests/testSetup";
import { ScrollArrowButton } from "../components/ScrollArrowButton";

describe("ScrollArrowButton", () => {
  it("should render a left scroll arrow", () => {
    render(<ScrollArrowButton direction="left" onClick={jest.fn()} />);

    expect(screen.getByLabelText("Scroll left")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
  });

  it("should render a right scroll arrow", () => {
    render(<ScrollArrowButton direction="right" onClick={jest.fn()} />);

    expect(screen.getByLabelText("Scroll right")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("should trigger the callback on click", async () => {
    const onClick = jest.fn();
    const { user } = render(<ScrollArrowButton direction="right" onClick={onClick} />);

    await user.click(screen.getByLabelText("Scroll right"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
