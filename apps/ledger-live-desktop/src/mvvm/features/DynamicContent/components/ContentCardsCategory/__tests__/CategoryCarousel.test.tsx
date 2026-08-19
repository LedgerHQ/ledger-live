import React, { act } from "react";
import { render, screen } from "tests/testSetup";
import CategoryCarousel from "../CategoryCarousel";

type Listener = () => void;

class FakeEmblaApi {
  private listeners: Record<string, Listener[]> = {};
  canScrollPrevValue = false;
  canScrollNextValue = true;
  scrollPrev = jest.fn();
  scrollNext = jest.fn();
  selectedScrollSnap = jest.fn(() => 0);
  scrollTo = jest.fn();

  canScrollPrev = () => this.canScrollPrevValue;
  canScrollNext = () => this.canScrollNextValue;

  on(event: string, listener: Listener) {
    this.listeners[event] = [...(this.listeners[event] ?? []), listener];
    return this;
  }

  off(event: string, listener: Listener) {
    this.listeners[event] = (this.listeners[event] ?? []).filter(l => l !== listener);
    return this;
  }

  emit(event: string) {
    (this.listeners[event] ?? []).forEach(listener => listener());
  }
}

let fakeEmblaApi: FakeEmblaApi;

jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: () => [jest.fn(), fakeEmblaApi],
}));

const slide = (id: string) => <div key={id}>{id}</div>;

beforeEach(() => {
  fakeEmblaApi = new FakeEmblaApi();
});

describe("CategoryCarousel", () => {
  it("renders no arrow when there is nothing to scroll to in either direction", () => {
    fakeEmblaApi.canScrollPrevValue = false;
    fakeEmblaApi.canScrollNextValue = false;

    render(<CategoryCarousel slides={[slide("a"), slide("b")]} />);

    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });

  it("only renders the right arrow when positioned on the first slide", () => {
    fakeEmblaApi.canScrollPrevValue = false;
    fakeEmblaApi.canScrollNextValue = true;

    render(<CategoryCarousel slides={[slide("a"), slide("b"), slide("c")]} />);

    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("only renders the left arrow when positioned on the last slide", () => {
    fakeEmblaApi.canScrollPrevValue = true;
    fakeEmblaApi.canScrollNextValue = false;

    render(<CategoryCarousel slides={[slide("a"), slide("b"), slide("c")]} />);

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });

  it("renders both arrows when positioned in the middle", () => {
    fakeEmblaApi.canScrollPrevValue = true;
    fakeEmblaApi.canScrollNextValue = true;

    render(<CategoryCarousel slides={[slide("a"), slide("b"), slide("c")]} />);

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();
  });

  it("updates arrow visibility when embla emits a select event", () => {
    fakeEmblaApi.canScrollPrevValue = false;
    fakeEmblaApi.canScrollNextValue = true;

    render(<CategoryCarousel slides={[slide("a"), slide("b"), slide("c")]} />);
    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();

    fakeEmblaApi.canScrollPrevValue = true;
    fakeEmblaApi.canScrollNextValue = false;
    act(() => {
      fakeEmblaApi.emit("select");
    });

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();
    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });

  it("renders a fade gradient on the scroll edge when more content is available", () => {
    fakeEmblaApi.canScrollPrevValue = false;
    fakeEmblaApi.canScrollNextValue = true;

    const { container } = render(<CategoryCarousel slides={[slide("a"), slide("b"), slide("c")]} />);

    expect(container.querySelector(".bg-gradient-to-l")).toBeInTheDocument();
  });

  it("calls scrollPrev/scrollNext when the arrows are clicked", async () => {
    fakeEmblaApi.canScrollPrevValue = true;
    fakeEmblaApi.canScrollNextValue = true;

    const { user } = render(<CategoryCarousel slides={[slide("a"), slide("b")]} />);

    await user.click(screen.getByLabelText("Scroll left"));
    expect(fakeEmblaApi.scrollPrev).toHaveBeenCalledTimes(1);

    await user.click(screen.getByLabelText("Scroll right"));
    expect(fakeEmblaApi.scrollNext).toHaveBeenCalledTimes(1);
  });
});
