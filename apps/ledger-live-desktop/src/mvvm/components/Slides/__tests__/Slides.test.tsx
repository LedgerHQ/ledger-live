import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import userEvent from "@testing-library/user-event";
import { Slides, useSlidesContext } from "../index";

function TestFooter() {
  const { goToNext } = useSlidesContext();
  return (
    <div>
      <button type="button" onClick={goToNext}>
        Continue
      </button>
    </div>
  );
}

function TestProgressIndicator() {
  const { currentIndex, totalSlides } = useSlidesContext();
  return (
    <div data-testid="progress">
      {currentIndex + 1} / {totalSlides}
    </div>
  );
}

describe("Slides", () => {
  it("renders first slide and exposes navigation via context", () => {
    render(
      <Slides initialSlideIndex={0}>
        <Slides.Content>
          <Slides.Content.Item>
            <div data-testid="slide-0">Slide 0</div>
          </Slides.Content.Item>
          <Slides.Content.Item>
            <div data-testid="slide-1">Slide 1</div>
          </Slides.Content.Item>
        </Slides.Content>
        <Slides.Footer>
          <TestFooter />
        </Slides.Footer>
        <Slides.ProgressIndicator>
          <TestProgressIndicator />
        </Slides.ProgressIndicator>
      </Slides>,
    );

    expect(screen.getByTestId("slide-0")).toBeInTheDocument();
    expect(screen.queryByTestId("slide-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveTextContent("1 / 2");
  });

  it("advances to next slide when Continue is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Slides initialSlideIndex={0}>
        <Slides.Content>
          <Slides.Content.Item>
            <div data-testid="slide-0">Slide 0</div>
          </Slides.Content.Item>
          <Slides.Content.Item>
            <div data-testid="slide-1">Slide 1</div>
          </Slides.Content.Item>
        </Slides.Content>
        <Slides.Footer>
          <TestFooter />
        </Slides.Footer>
        <Slides.ProgressIndicator>
          <TestProgressIndicator />
        </Slides.ProgressIndicator>
      </Slides>,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.queryByTestId("slide-0")).not.toBeInTheDocument();
      expect(screen.getByTestId("slide-1")).toBeInTheDocument();
    });
    expect(screen.getByTestId("progress")).toHaveTextContent("2 / 2");
  });

  it("calls onSlideChange when index changes", async () => {
    const user = userEvent.setup();
    const onSlideChange = jest.fn();

    render(
      <Slides initialSlideIndex={0} onSlideChange={onSlideChange}>
        <Slides.Content>
          <Slides.Content.Item>
            <div data-testid="slide-0">Slide 0</div>
          </Slides.Content.Item>
          <Slides.Content.Item>
            <div data-testid="slide-1">Slide 1</div>
          </Slides.Content.Item>
        </Slides.Content>
        <Slides.Footer>
          <TestFooter />
        </Slides.Footer>
      </Slides>,
    );

    expect(onSlideChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSlideChange).toHaveBeenCalledTimes(1);
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });
});
