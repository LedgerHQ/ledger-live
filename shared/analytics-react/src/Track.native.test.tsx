jest.mock("@react-navigation/native", () => ({ useIsFocused: jest.fn() }));

import { render } from "@testing-library/react-native";
import { setAnalytics, setStore, setTrackingSelector } from "@shared/analytics";
import { Track } from ".";

const track = jest.fn();

beforeEach(() => {
  track.mockClear();
  setAnalytics({ track });
  setStore({ getState: () => ({}) });
  setTrackingSelector(() => true);
});

describe("Track (native entry point)", () => {
  it("tracks the on-mount event once (even if the component is re-evaluated)", () => {
    const { rerender } = render(<Track onMount event="Some Event" foo="bar" />);
    rerender(<Track onMount event="Some Event" foo="bar" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Some Event", {
      page: undefined,
      foo: "bar",
    });
  });

  it("tracks the event when a property changes and onUpdate is set", () => {
    const { rerender } = render(<Track onUpdate event="Filter Changed" filter="all" />);
    rerender(<Track onUpdate event="Filter Changed" filter="favourites" />);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("Filter Changed", {
      page: undefined,
      filter: "favourites",
    });
  });
});
