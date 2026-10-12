import React from "react";
import { act, render } from "@testing-library/react";
import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { Lottie } from "./Lottie.web";

jest.mock("@lottiefiles/dotlottie-react", () => ({
  DotLottieReact: jest.fn(() => <canvas data-testid="dotlottie" />),
}));

const mockedDotLottie = jest.mocked(DotLottieReact);

type Listener = () => void;

function createPlayer(isLoaded = true) {
  const listeners = new Map<string, Set<Listener>>();
  return {
    isLoaded,
    play: jest.fn(),
    pause: jest.fn(),
    addEventListener: jest.fn((type: string, listener: Listener) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    }),
    removeEventListener: jest.fn((type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    }),
    emit(type: string) {
      listeners.get(type)?.forEach(listener => listener());
    },
  };
}

function lastProps() {
  const props = mockedDotLottie.mock.calls.at(-1)?.[0];
  if (!props) throw new Error("DotLottieReact was not rendered");
  return props;
}

function attach(player: ReturnType<typeof createPlayer>) {
  act(() => lastProps().dotLottieRefCallback?.(player as unknown as DotLottie));
}

describe("Lottie (web)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads a string source from its URL", () => {
    render(<Lottie source="/loader.lottie" />);

    expect(lastProps()).toEqual(expect.objectContaining({ src: "/loader.lottie" }));
    expect(lastProps()).not.toHaveProperty("data");
  });

  it("loads an object source as animation data", () => {
    const data = { v: "5" };

    render(<Lottie source={data} />);

    expect(lastProps()).toEqual(expect.objectContaining({ data }));
    expect(lastProps()).not.toHaveProperty("src");
  });

  it("does not loop and autoplays by default", () => {
    render(<Lottie source="/a.lottie" />);

    expect(lastProps()).toEqual(expect.objectContaining({ loop: false, autoplay: true }));
  });

  it("reserves the animation's size with a shrinkable spacer and lays the canvas over it", () => {
    const { container } = render(
      <Lottie source={{ w: 400, h: 200 }} style={{ width: 120 }} role="presentation" testID="a" />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveStyle({ position: "relative", width: "120px" });
    expect(root).toHaveAttribute("role", "presentation");
    expect(root).toHaveAttribute("data-testid", "a");
    expect(root.querySelector("svg")).toHaveAttribute("viewBox", "0 0 400 200");
    expect(lastProps().style).toEqual({ position: "absolute", inset: 0 });
  });

  it("renders the canvas alone when the size is unknown", () => {
    const { container } = render(<Lottie source={{}} style={{ width: 120 }} />);

    expect(container.querySelector("svg")).toBeNull();
    expect(lastProps().style).toEqual({ width: 120 });
  });

  it("omits the layout when neither fit nor align is given", () => {
    render(<Lottie source="/a.lottie" />);

    expect(lastProps().layout).toBeUndefined();
  });

  it("resizes the canvas with its container so late layout does not stretch the first frame", () => {
    render(<Lottie source="/a.lottie" />);

    expect(lastProps().renderConfig).toEqual({ autoResize: true });
  });

  it("maps fit and align to the dotlottie layout", () => {
    render(<Lottie source="/a.lottie" fit="cover" align={[1, 1]} />);

    expect(lastProps().layout).toEqual({ fit: "cover", align: [1, 1] });
  });

  it("leaves playback alone while paused is undefined", () => {
    const player = createPlayer();
    render(<Lottie source="/a.lottie" />);

    attach(player);

    expect(player.play).not.toHaveBeenCalled();
    expect(player.pause).not.toHaveBeenCalled();
  });

  it("pauses and resumes the player following the paused prop", () => {
    const player = createPlayer();
    const { rerender } = render(<Lottie source="/a.lottie" paused />);
    attach(player);
    expect(player.pause).toHaveBeenCalledTimes(1);

    rerender(<Lottie source="/a.lottie" paused={false} />);

    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("waits for the animation to load before playing", () => {
    const player = createPlayer(false);
    render(<Lottie source="/a.lottie" paused={false} />);
    attach(player);
    expect(player.play).not.toHaveBeenCalled();

    act(() => player.emit("load"));

    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("plays the new animation, not the stale one, when the source changes while resuming", () => {
    const player = createPlayer();
    const { rerender } = render(<Lottie source={{ id: "collapse" }} paused />);
    attach(player);
    player.play.mockClear();
    player.isLoaded = false;

    rerender(<Lottie source={{ id: "expand" }} paused={false} />);
    expect(player.play).not.toHaveBeenCalled();

    player.isLoaded = true;
    act(() => player.emit("load"));
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("reports completion and stops listening on unmount", () => {
    const player = createPlayer();
    const onComplete = jest.fn();
    const { unmount } = render(<Lottie source="/a.lottie" onComplete={onComplete} />);
    attach(player);

    act(() => player.emit("complete"));
    expect(onComplete).toHaveBeenCalledTimes(1);

    unmount();
    act(() => player.emit("complete"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
