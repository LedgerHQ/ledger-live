import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { Slides, useSlidesContext } from "../index";

type RenderComponentOptions = {
  initialSlideIndex?: number;
  onSlideChange?: (index: number) => void;
  withProgressIndicator?: boolean;
};

function renderComponent({
  initialSlideIndex = 0,
  onSlideChange,
  withProgressIndicator = true,
}: RenderComponentOptions = {}) {
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
      <div>
        {currentIndex + 1} / {totalSlides}
      </div>
    );
  }

  return render(
    <Slides initialSlideIndex={initialSlideIndex} onSlideChange={onSlideChange}>
      <Slides.Content>
        <Slides.Content.Item>
          <div>Slide 0</div>
        </Slides.Content.Item>
        <Slides.Content.Item>
          <div>Slide 1</div>
        </Slides.Content.Item>
      </Slides.Content>
      <Slides.Footer>
        <TestFooter />
      </Slides.Footer>
      {withProgressIndicator ? (
        <Slides.ProgressIndicator>
          <TestProgressIndicator />
        </Slides.ProgressIndicator>
      ) : null}
    </Slides>,
  );
}

describe("Slides", () => {
  it("renders first slide and exposes navigation via context", () => {
    renderComponent();

    expect(screen.getByText("Slide 0")).toBeInTheDocument();
    expect(screen.queryByText("Slide 1")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("advances to next slide when Continue is clicked", async () => {
    const { user } = renderComponent();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    const slideOutAnimationStart = new Event("animationstart", {
      bubbles: true,
    });
    Object.defineProperty(slideOutAnimationStart, "animationName", {
      value: "slide-out-to-left",
    });
    fireEvent(screen.getByText("Slide 0"), slideOutAnimationStart);

    expect(screen.queryByText("Slide 0")).not.toBeInTheDocument();
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("can start at index other than 0", () => {
    renderComponent({ initialSlideIndex: 1, withProgressIndicator: false });

    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.queryByText("Slide 0")).not.toBeInTheDocument();
  });

  it("calls onSlideChange when index changes", async () => {
    const onSlideChange = jest.fn();

    const { user } = renderComponent({ onSlideChange, withProgressIndicator: false });

    expect(onSlideChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSlideChange).toHaveBeenCalledTimes(1);
    expect(onSlideChange).toHaveBeenCalledWith(1);
  });
});
