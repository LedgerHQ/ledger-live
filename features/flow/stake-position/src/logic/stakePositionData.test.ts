import type { z } from "zod";
import type { EarnPositionSchema } from "@domain/entity-earn-position";
import { mockEarnPosition, mockEarnPositions } from "@domain/entity-earn-position/schema.mock";
import { resolveStakePositionData, type StakePositionDataInput } from "./stakePositionData";

const POSITION_ID = "StakeAccountA1111111111111111111111111111111";
const OTHER_POSITION_ID = "StakeAccountB2222222222222222222222222222222";
const retry = jest.fn();

const position = (overrides?: Partial<z.input<typeof EarnPositionSchema>>) =>
  mockEarnPosition({ id: POSITION_ID, ...overrides });

function resolve(overrides: Partial<StakePositionDataInput> = {}) {
  return resolveStakePositionData({
    positions: mockEarnPositions({ positions: [position()] }),
    isError: false,
    positionId: POSITION_ID,
    isPolling: false,
    retry,
    ...overrides,
  });
}

describe("resolveStakePositionData", () => {
  it("should be loading until the first positions arrive", () => {
    expect(resolve({ positions: undefined })).toEqual({ kind: "loading" });
  });

  it("should fail with a retry when the first read fails", () => {
    expect(resolve({ positions: undefined, isError: true })).toEqual({ kind: "error", retry });
  });

  it("should show the position of the stake account with the backend status as displayed", () => {
    expect(resolve()).toEqual({
      kind: "ready",
      position: position(),
      status: "active",
      isStale: false,
      isPolling: false,
    });
  });

  it("should keep showing the positions it has when a later read fails", () => {
    expect(resolve({ isError: true })).toMatchObject({ kind: "ready" });
  });

  it("should carry a stale snapshot and the wait for the user's own transaction", () => {
    const data = resolve({
      positions: mockEarnPositions({ positions: [position()], isStale: true }),
      isPolling: true,
    });

    expect(data).toMatchObject({ kind: "ready", isStale: true, isPolling: true });
  });

  it("should fail, not miss the position, when the latest read failed and the row is missing", () => {
    const data = resolve({
      positions: mockEarnPositions({ positions: [position({ id: OTHER_POSITION_ID })] }),
      isError: true,
    });

    expect(data).toEqual({ kind: "error", retry });
  });

  it("should pick the row of the stake account among the positions of the address", () => {
    const data = resolve({
      positions: mockEarnPositions({
        positions: [position({ id: OTHER_POSITION_ID, status: "deactivated" }), position()],
      }),
    });

    expect(data).toMatchObject({ kind: "ready", status: "active" });
  });

  it("should fail when two rows carry the id of the stake account", () => {
    const data = resolve({ positions: mockEarnPositions({ positions: [position(), position()] }) });

    expect(data).toEqual({ kind: "error", retry });
  });

  it("should not find a position the address does not hold", () => {
    const data = resolve({
      positions: mockEarnPositions({ positions: [position({ id: OTHER_POSITION_ID })] }),
    });

    expect(data).toEqual({ kind: "notFound" });
  });

  it("should fail, not miss the position, when a provider failed and the row is missing", () => {
    const data = resolve({
      positions: mockEarnPositions({
        positions: [],
        failures: [{ code: 503, reason: "Provider unavailable" }],
      }),
    });

    expect(data).toEqual({ kind: "error", retry });
  });

  it("should show the row even though a provider failed for other rows", () => {
    const data = resolve({
      positions: mockEarnPositions({
        positions: [position()],
        failures: [{ code: 503, reason: "Provider unavailable" }],
      }),
    });

    expect(data).toMatchObject({ kind: "ready" });
  });

  it("should not find a closed position", () => {
    expect(
      resolve({ positions: mockEarnPositions({ positions: [position({ status: "archived" })] }) }),
    ).toEqual({
      kind: "notFound",
    });
  });

  it("should not show a position whose status this version does not know", () => {
    expect(
      resolve({ positions: mockEarnPositions({ positions: [position({ status: "unknown" })] }) }),
    ).toEqual({
      kind: "notFound",
    });
  });

  it.each([
    ["activating", "activating"],
    ["deactivating", "deactivating"],
    ["deactivated", "inactive"],
  ] as const)("should show a %s row as %s", (status, displayed) => {
    expect(
      resolve({ positions: mockEarnPositions({ positions: [position({ status })] }) }),
    ).toMatchObject({
      kind: "ready",
      status: displayed,
    });
  });
});
