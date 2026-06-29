import React, { useRef } from "react";
import { View } from "react-native";
import { act, render } from "@tests/test-renderer";
import { InViewProvider, useInViewContext } from "./index";
import { inViewStatus } from "./utils";
import type { InViewEntry } from "./types";

jest.mock("./utils", () => ({
  inViewStatus: jest.fn(),
}));

const mockedInViewStatus = jest.mocked(inViewStatus);

const INTERVAL = 200;

const entry = (isInView: boolean): InViewEntry => ({
  boundingClientRect: { x: 0, y: 0, width: 100, height: 100 },
  isInView,
  progressRatio: isInView ? 1 : 0,
});

function Consumer({
  onUpdate,
  depValue,
}: {
  onUpdate: (entry: InViewEntry) => void;
  depValue: number;
}) {
  const ref = useRef<View | null>(null);
  // Inline callback like the real carousel; changing `depValue` forces a re-subscription.
  useInViewContext(entry => onUpdate(entry), [onUpdate, depValue], ref);
  return <View ref={ref} />;
}

// Advances the rxjs interval one tick and flushes the async measurement chain.
const tick = async () => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(INTERVAL);
  });
};

describe("InViewContext", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedInViewStatus.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("fires onInViewUpdate once when a target becomes visible", async () => {
    mockedInViewStatus.mockResolvedValue(entry(true));
    const onUpdate = jest.fn();

    render(
      <InViewProvider intervalDuration={INTERVAL}>
        <Consumer onUpdate={onUpdate} depValue={0} />
      </InViewProvider>,
    );

    await tick();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ isInView: true }));
  });

  it("does not re-fire when the same target is re-subscribed while still in view", async () => {
    mockedInViewStatus.mockResolvedValue(entry(true));
    const onUpdate = jest.fn();

    const { rerender } = render(
      <InViewProvider intervalDuration={INTERVAL}>
        <Consumer onUpdate={onUpdate} depValue={0} />
      </InViewProvider>,
    );

    await tick();
    expect(onUpdate).toHaveBeenCalledTimes(1);

    // New WatchedItem, same target ref — like the carousel rebuilding `items`.
    rerender(
      <InViewProvider intervalDuration={INTERVAL}>
        <Consumer onUpdate={onUpdate} depValue={1} />
      </InViewProvider>,
    );

    await tick();

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it("fires again on a genuine visibility transition (out then back in)", async () => {
    mockedInViewStatus.mockResolvedValue(entry(true));
    const onUpdate = jest.fn();

    render(
      <InViewProvider intervalDuration={INTERVAL}>
        <Consumer onUpdate={onUpdate} depValue={0} />
      </InViewProvider>,
    );

    await tick();
    expect(onUpdate).toHaveBeenCalledTimes(1);

    mockedInViewStatus.mockResolvedValue(entry(false));
    await tick();
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ isInView: false }));

    mockedInViewStatus.mockResolvedValue(entry(true));
    await tick();
    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ isInView: true }));
  });
});
