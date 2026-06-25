import { afterAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { CliProcessExitError } from "../cli-process-exit-error";
import * as segment from "./segment";
import { withCommandLifecycleAnalytics } from "./lifecycle-analytics";

type TrackCall = { event: string; properties?: Record<string, unknown> | null };

const trackCalls: TrackCall[] = [];

const trackSpy = spyOn(segment, "track").mockImplementation((event, properties) => {
  trackCalls.push({ event, properties });
});

afterAll(() => {
  trackSpy.mockRestore();
});

const events = () => trackCalls.map(c => c.event);

describe("withCommandLifecycleAnalytics", () => {
  beforeEach(() => {
    trackCalls.length = 0;
  });

  it("tracks invoked then completed on a zero exit code", async () => {
    const exitCode = await withCommandLifecycleAnalytics(["balances", "--dry-run"], async () => 0);

    expect(exitCode).toBe(0);
    expect(events()).toEqual(["command_invoked", "command_completed"]);
    expect(trackCalls[0].properties).toMatchObject({
      command: "balances",
      dryRun: true,
      flagsUsed: ["dry-run"],
    });
    expect(typeof trackCalls[1].properties?.durationMs).toBe("number");
  });

  it("tracks failed (not completed) on a non-zero return without throwing", async () => {
    const exitCode = await withCommandLifecycleAnalytics(["balances"], async () => 2);

    expect(exitCode).toBe(2);
    expect(events()).toEqual(["command_invoked", "command_failed"]);
    expect(trackCalls[1].properties?.errorName).toBe("process_exit");
  });

  it("converts a thrown CliProcessExitError to its code and tracks failed without rethrowing", async () => {
    const exitCode = await withCommandLifecycleAnalytics(["balances"], async () => {
      throw new CliProcessExitError(3);
    });

    expect(exitCode).toBe(3);
    expect(events()).toEqual(["command_invoked", "command_failed"]);
    expect(trackCalls[1].properties?.errorName).toBe("process_exit");
  });

  it("tracks failed with a real error name and rethrows an unexpected error", async () => {
    const boom = new Error("boom");

    await expect(
      withCommandLifecycleAnalytics(["balances"], async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);

    expect(events()).toEqual(["command_invoked", "command_failed"]);
    expect(trackCalls[1].properties?.errorName).not.toBe("process_exit");
  });

  it("tracks nothing when no command can be parsed", async () => {
    const exitCode = await withCommandLifecycleAnalytics(["nope"], async () => 0);

    expect(exitCode).toBe(0);
    expect(trackCalls).toHaveLength(0);
  });

  describe("help view tracking", () => {
    const helpCalls = () => trackCalls.filter(c => c.event === "help_viewed");

    it("tracks help viewed for --help with no command", async () => {
      await withCommandLifecycleAnalytics(["--help"], async () => 0);

      expect(helpCalls()).toHaveLength(1);
      expect(helpCalls()[0].properties).not.toHaveProperty("command");
    });

    it("tracks help viewed for -h with no command", async () => {
      await withCommandLifecycleAnalytics(["-h"], async () => 0);

      expect(helpCalls()).toHaveLength(1);
      expect(helpCalls()[0].properties).not.toHaveProperty("command");
    });

    it("includes the subcommand when help is requested for a command", async () => {
      await withCommandLifecycleAnalytics(["send", "--help"], async () => 0);

      expect(helpCalls()).toHaveLength(1);
      expect(helpCalls()[0].properties).toMatchObject({ command: "send" });
    });

    it("does not track help viewed without a help flag", async () => {
      await withCommandLifecycleAnalytics(["send", "--json"], async () => 0);

      expect(helpCalls()).toHaveLength(0);
    });
  });
});
