import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Observable } from "rxjs";
import type { GetGenuineCheckFromDeviceIdResult } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { DeviceLock } from "../../mcp/device-lock";
import { withMcpHarness } from "../helpers/mcp-runner";

// Shared, mutable observable factory so we can drive concurrent genuine_check calls and observe
// whether their device work interleaves.
let genuineCheckImpl: () => Observable<GetGenuineCheckFromDeviceIdResult>;

mock.module("@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId", () => ({
  getGenuineCheckFromDeviceId: () => genuineCheckImpl(),
}));

const MOCK_DMK_ENV = { WALLET_CLI_MOCK_DMK: "1" };

describe("DeviceLock (async mutex)", () => {
  it("serializes acquirers in FIFO order", async () => {
    const lock = new DeviceLock();
    const order: number[] = [];

    const release1 = await lock.acquire();
    expect(lock.isLocked).toBe(true);

    // Two waiters queue up behind the held lock.
    const p2 = lock.acquire().then(release => {
      order.push(2);
      release();
    });
    const p3 = lock.acquire().then(release => {
      order.push(3);
      release();
    });

    // Nothing else can run while the first holder keeps the lock.
    await Promise.resolve();
    expect(order).toEqual([]);

    order.push(1);
    release1();
    await Promise.all([p2, p3]);

    expect(order).toEqual([1, 2, 3]);
    expect(lock.isLocked).toBe(false);
  });

  it("runExclusive releases even when the body throws", async () => {
    const lock = new DeviceLock();
    await expect(
      lock.runExclusive(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(lock.isLocked).toBe(false);

    // Lock is reusable after a throwing body.
    const release = await lock.acquire();
    expect(lock.isLocked).toBe(true);
    release();
  });
});

describe("mcp device-lock serialization", () => {
  let active = 0;
  let maxActive = 0;
  let events: string[] = [];

  beforeEach(() => {
    active = 0;
    maxActive = 0;
    events = [];
    // Each subscription simulates a device operation that spans an async gap: if two device
    // tools ran concurrently, `active` would reach 2. The mutex must keep it at 1.
    genuineCheckImpl = () =>
      new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        events.push("start");
        setTimeout(() => {
          events.push("end");
          active -= 1;
          subscriber.next({
            socketEvent: { type: "result", payload: "0000" },
            lockedDevice: false,
          });
          subscriber.complete();
        }, 25);
      });
  });

  it("two concurrent genuine_check calls do not interleave device work", async () => {
    await withMcpHarness(MOCK_DMK_ENV, async ({ callTool }) => {
      const [a, b] = await Promise.all([callTool("genuine_check"), callTool("genuine_check")]);

      expect(a.isError).toBe(false);
      expect(b.isError).toBe(false);
      expect((a.structuredContent as Record<string, unknown>).genuine).toBe(true);
      expect((b.structuredContent as Record<string, unknown>).genuine).toBe(true);

      // The lock forces sequential execution: at most one device op at a time, and the two
      // operations do not overlap (start/end/start/end, never start/start/…).
      expect(maxActive).toBe(1);
      expect(events).toEqual(["start", "end", "start", "end"]);
    });
  });
});
