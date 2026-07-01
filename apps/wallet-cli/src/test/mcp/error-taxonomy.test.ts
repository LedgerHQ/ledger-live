import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Observable } from "rxjs";
import {
  DeviceOnDashboardExpected,
  DisconnectedDevice,
  UserRefusedAllowManager,
} from "@ledgerhq/errors";
import type { GetGenuineCheckFromDeviceIdResult } from "@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId";
import { withMcpHarness } from "../helpers/mcp-runner";

let genuineCheckImpl: () => Observable<GetGenuineCheckFromDeviceIdResult>;

mock.module("@ledgerhq/live-common/hw/getGenuineCheckFromDeviceId", () => ({
  getGenuineCheckFromDeviceId: () => genuineCheckImpl(),
}));

const MOCK_DMK_ENV = { WALLET_CLI_MOCK_DMK: "1" };

function failingWith(error: unknown): () => Observable<GetGenuineCheckFromDeviceIdResult> {
  return () =>
    new Observable<GetGenuineCheckFromDeviceIdResult>(subscriber => {
      subscriber.error(error);
    });
}

describe("mcp error taxonomy — device errors surface as isError with code + exitCode", () => {
  beforeEach(() => {
    genuineCheckImpl = failingWith(new Error("unset"));
  });

  it("wrong_app: dashboard-expected maps to code=wrong_app, exitCode=4", async () => {
    genuineCheckImpl = failingWith(new DeviceOnDashboardExpected());
    const result = await withMcpHarness(MOCK_DMK_ENV, ({ callTool }) => callTool("genuine_check"));

    expect(result.isError).toBe(true);
    const err = result.structuredContent as Record<string, unknown>;
    expect(err.code).toBe("wrong_app");
    expect(err.exitCode).toBe(4);
    expect(result.data).toEqual(result.structuredContent);
  });

  it("rejected: user refused maps to code=rejected, exitCode=2", async () => {
    genuineCheckImpl = failingWith(new UserRefusedAllowManager());
    const result = await withMcpHarness(MOCK_DMK_ENV, ({ callTool }) => callTool("genuine_check"));

    expect(result.isError).toBe(true);
    const err = result.structuredContent as Record<string, unknown>;
    expect(err.code).toBe("rejected");
    expect(err.exitCode).toBe(2);
  });

  it("disconnected: transport disconnect maps to code=disconnected, exitCode=3", async () => {
    genuineCheckImpl = failingWith(new DisconnectedDevice("device unplugged"));
    const result = await withMcpHarness(MOCK_DMK_ENV, ({ callTool }) => callTool("genuine_check"));

    expect(result.isError).toBe(true);
    const err = result.structuredContent as Record<string, unknown>;
    expect(err.code).toBe("disconnected");
    expect(err.exitCode).toBe(3);
  });
});
