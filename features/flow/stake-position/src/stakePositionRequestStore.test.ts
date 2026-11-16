import { act, renderHook } from "@testing-library/react";
import {
  abandonStakePosition,
  commitStakePosition,
  dismissStakePosition,
  reopenStakePosition,
  settleStakePosition,
  settleStakePositionUnavailable,
  useIsStakePositionShown,
  useShownStakePosition,
  useStakePositionRequester,
} from "./stakePositionRequestStore";
import {
  getStakePositionRequest,
  requestStakePosition,
} from "./stakePositionRequestStore.internals";
import type { StakePositionOrigin, StakePositionRequestInput } from "./types";

const INPUT: StakePositionRequestInput = {
  accountId: "host-account-id",
  positionId: "stake-account-address",
  validatorAddress: "validator-vote-address",
  rewards: "1000000000",
};

// Only Earn requests positions today: a second origin stands for the next surface.
const OTHER_ORIGIN = "assetPage" as StakePositionOrigin;

const flushPromises = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));

const phaseOf = () => getStakePositionRequest()?.phase ?? "removed";

function open(origin: StakePositionOrigin = "earn", owner = Symbol("requester")) {
  const onResult = jest.fn();
  const onError = jest.fn();
  let promise: Promise<unknown> = Promise.resolve();
  act(() => {
    promise = requestStakePosition({ ...INPUT, origin }, owner).then(onResult, onError);
  });
  const id = getStakePositionRequest()?.shown.id ?? -1;
  return { id, promise, onResult, onError };
}

describe("stakePositionRequestStore", () => {
  afterEach(() => {
    const request = getStakePositionRequest();
    if (request) act(() => abandonStakePosition(request.shown.id));
  });

  it("should keep a new request open until the user answers", async () => {
    const { result } = renderHook(() => useShownStakePosition());

    const request = open();
    await flushPromises();

    expect(result.current).toEqual({
      request: { ...INPUT, origin: "earn", id: request.id },
      phase: "open",
    });
    expect(request.onResult).not.toHaveBeenCalled();
  });

  it("should answer null and remove the request when the user dismisses it", async () => {
    const request = open();

    act(() => dismissStakePosition(request.id));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledWith({ action: null });
    expect(phaseOf()).toBe("removed");
  });

  it("should answer null to an open request that a new one replaces", async () => {
    const first = open();

    const second = open();
    await flushPromises();

    expect(first.onResult).toHaveBeenCalledWith({ action: null });
    expect(getStakePositionRequest()?.shown.id).toBe(second.id);
    expect(phaseOf()).toBe("open");
  });

  it("should refuse a new request while one is committed, without touching it", async () => {
    const committed = open();
    act(() => commitStakePosition(committed.id));

    const refused = open();
    await flushPromises();

    expect(refused.onError).toHaveBeenCalledWith(
      expect.objectContaining({ name: "StakePositionBusy" }),
    );
    expect(getStakePositionRequest()?.shown.id).toBe(committed.id);
    expect(phaseOf()).toBe("committed");
    expect(committed.onResult).not.toHaveBeenCalled();
  });

  it("should replace a settled request without answering it again", async () => {
    const settled = open();
    act(() => settleStakePosition(settled.id, "earnMore"));

    const next = open();
    await flushPromises();

    expect(settled.onResult).toHaveBeenCalledTimes(1);
    expect(getStakePositionRequest()?.shown.id).toBe(next.id);
    expect(phaseOf()).toBe("open");
  });

  it("should keep a committed request pending when the user tries to dismiss it", async () => {
    const request = open();
    act(() => commitStakePosition(request.id));

    act(() => dismissStakePosition(request.id));
    await flushPromises();

    expect(request.onResult).not.toHaveBeenCalled();
    expect(phaseOf()).toBe("committed");
  });

  it("should answer the action once broadcast, and keep the result shown until it is closed", async () => {
    const request = open();
    act(() => commitStakePosition(request.id));

    act(() => settleStakePosition(request.id, "deactivate"));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledWith({ action: "deactivate" });
    expect(phaseOf()).toBe("settled");

    act(() => dismissStakePosition(request.id));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledTimes(1);
    expect(phaseOf()).toBe("removed");
  });

  it("should answer earnMore from an open request", async () => {
    const request = open();

    act(() => settleStakePosition(request.id, "earnMore"));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledWith({ action: "earnMore" });
  });

  it("should answer once when the request is settled twice", async () => {
    const request = open();

    act(() => settleStakePosition(request.id, "withdraw"));
    act(() => settleStakePosition(request.id, "earnMore"));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledTimes(1);
    expect(request.onResult).toHaveBeenCalledWith({ action: "withdraw" });
  });

  it("should answer null and remove a committed request the flow abandons", async () => {
    const request = open();
    act(() => commitStakePosition(request.id));

    act(() => abandonStakePosition(request.id));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledWith({ action: null });
    expect(phaseOf()).toBe("removed");
  });

  it("should remove a settled request the flow abandons without answering it again", async () => {
    const request = open();
    act(() => settleStakePosition(request.id, "deactivate"));

    act(() => abandonStakePosition(request.id));
    await flushPromises();

    expect(request.onResult).toHaveBeenCalledTimes(1);
    expect(phaseOf()).toBe("removed");
  });

  describe("when the host cannot act on the position", () => {
    it("should answer the reason and remove the request", async () => {
      const request = open();

      act(() => settleStakePositionUnavailable(request.id, "ambiguous"));
      await flushPromises();

      expect(request.onResult).toHaveBeenCalledWith({ action: null, reason: "ambiguous" });
      expect(phaseOf()).toBe("removed");
    });

    it("should answer once when it is reported twice", async () => {
      const request = open();

      act(() => settleStakePositionUnavailable(request.id, "notFound"));
      act(() => settleStakePositionUnavailable(request.id, "ambiguous"));
      await flushPromises();

      expect(request.onResult).toHaveBeenCalledTimes(1);
      expect(request.onResult).toHaveBeenCalledWith({ action: null, reason: "notFound" });
    });

    it("should leave a committed request going", async () => {
      const request = open();
      act(() => commitStakePosition(request.id));

      act(() => settleStakePositionUnavailable(request.id, "notFound"));
      await flushPromises();

      expect(request.onResult).not.toHaveBeenCalled();
      expect(phaseOf()).toBe("committed");
    });
  });

  describe("when a signed transaction fails and the user can retry", () => {
    it("should reopen the committed request so the user can dismiss it", async () => {
      const request = open();
      act(() => commitStakePosition(request.id));

      act(() => reopenStakePosition(request.id));
      expect(phaseOf()).toBe("open");

      act(() => dismissStakePosition(request.id));
      await flushPromises();

      expect(request.onResult).toHaveBeenCalledWith({ action: null });
      expect(phaseOf()).toBe("removed");
    });

    it("should let the user commit the retry again", () => {
      const request = open();
      act(() => commitStakePosition(request.id));
      act(() => reopenStakePosition(request.id));

      act(() => commitStakePosition(request.id));

      expect(phaseOf()).toBe("committed");
    });

    it("should not reopen a request that is not committed", () => {
      const request = open();
      act(() => settleStakePosition(request.id, "deactivate"));

      act(() => reopenStakePosition(request.id));

      expect(phaseOf()).toBe("settled");
    });
  });

  it.each([
    ["dismissStakePosition", (id: number) => dismissStakePosition(id)],
    ["commitStakePosition", (id: number) => commitStakePosition(id)],
    ["reopenStakePosition", (id: number) => reopenStakePosition(id)],
    ["settleStakePosition", (id: number) => settleStakePosition(id, "deactivate")],
    [
      "settleStakePositionUnavailable",
      (id: number) => settleStakePositionUnavailable(id, "notFound"),
    ],
    ["abandonStakePosition", (id: number) => abandonStakePosition(id)],
  ])("should ignore %s with the id of a former request", async (_name, call) => {
    const former = open();
    const current = open();

    act(() => call(former.id));
    await flushPromises();

    expect(current.onResult).not.toHaveBeenCalled();
    expect(getStakePositionRequest()?.shown.id).toBe(current.id);
    expect(phaseOf()).toBe("open");
  });

  describe("useStakePositionRequester", () => {
    it("should open a request of its origin", () => {
      const { result: shown } = renderHook(() => useShownStakePosition("earn"));
      const { result: requester } = renderHook(() => useStakePositionRequester("earn"));

      act(() => {
        void requester.current(INPUT);
      });

      expect(shown.current.request).toMatchObject({ ...INPUT, origin: "earn" });
      expect(shown.current.phase).toBe("open");
    });

    it("should dismiss its own open request when its player unmounts", async () => {
      const player = renderHook(() => useStakePositionRequester("earn"));
      const onResult = jest.fn();
      act(() => {
        void player.result.current(INPUT).then(onResult);
      });

      player.unmount();
      await flushPromises();

      expect(onResult).toHaveBeenCalledWith({ action: null });
      expect(phaseOf()).toBe("removed");
    });

    it("should keep its own committed request when its player unmounts", async () => {
      const player = renderHook(() => useStakePositionRequester("earn"));
      const onResult = jest.fn();
      act(() => {
        void player.result.current(INPUT).then(onResult);
      });
      act(() => commitStakePosition(getStakePositionRequest()?.shown.id ?? -1));

      player.unmount();
      await flushPromises();

      expect(onResult).not.toHaveBeenCalled();
      expect(phaseOf()).toBe("committed");
    });

    it("should leave the request of another player when its player unmounts", async () => {
      const firstPlayer = renderHook(() => useStakePositionRequester("earn"));
      const secondPlayer = renderHook(() => useStakePositionRequester("earn"));
      const onResult = jest.fn();
      act(() => {
        void firstPlayer.result.current(INPUT);
      });
      act(() => {
        void secondPlayer.result.current(INPUT).then(onResult);
      });

      firstPlayer.unmount();
      await flushPromises();

      expect(onResult).not.toHaveBeenCalled();
      expect(phaseOf()).toBe("open");
    });
  });

  describe("useShownStakePosition", () => {
    it("should keep the last request as closed once it is removed", () => {
      const { result } = renderHook(() => useShownStakePosition("earn"));
      const request = open();

      act(() => dismissStakePosition(request.id));

      expect(result.current).toEqual({
        request: expect.objectContaining({ id: request.id }),
        phase: "closed",
      });
    });

    it("should follow the phase of the request", () => {
      const { result } = renderHook(() => useShownStakePosition("earn"));
      const request = open();

      act(() => commitStakePosition(request.id));
      expect(result.current.phase).toBe("committed");

      act(() => settleStakePosition(request.id, "withdraw"));
      expect(result.current.phase).toBe("settled");
    });

    it("should show only the requests of its origin", () => {
      const { result: earn } = renderHook(() => useShownStakePosition("earn"));
      const { result: other } = renderHook(() => useShownStakePosition(OTHER_ORIGIN));

      const request = open("earn");

      expect(earn.current.request?.id).toBe(request.id);
      expect(other.current).toEqual({ request: null, phase: "closed" });
    });

    it("should show nothing to a surface mounted after the last request closed", () => {
      const request = open();
      act(() => dismissStakePosition(request.id));

      const { result } = renderHook(() => useShownStakePosition("earn"));

      expect(result.current).toEqual({ request: null, phase: "closed" });
    });
  });

  describe("useIsStakePositionShown", () => {
    it("should be true from the request until its removal, whatever the phase", () => {
      const { result } = renderHook(() => useIsStakePositionShown("earn"));
      expect(result.current).toBe(false);

      const request = open();
      expect(result.current).toBe(true);
      act(() => commitStakePosition(request.id));
      expect(result.current).toBe(true);
      act(() => settleStakePosition(request.id, "deactivate"));
      expect(result.current).toBe(true);

      act(() => dismissStakePosition(request.id));
      expect(result.current).toBe(false);
    });

    it("should ignore the requests of another origin", () => {
      const { result } = renderHook(() => useIsStakePositionShown(OTHER_ORIGIN));

      open("earn");

      expect(result.current).toBe(false);
    });
  });
});
