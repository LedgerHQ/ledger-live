import { afterAll, describe, expect, it } from "bun:test";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";

describe("agent-intent intents (CLI)", () => {
  const fixture = makeSessionDir([]);
  afterAll(() => fixture.cleanup());

  it("refuses --cursor with --page-size even when the size isn't allowed", async () => {
    const { stdout, exitCode } = await runCli(
      [
        "agent-intent",
        "intents",
        "--profile",
        "bot",
        "--cursor",
        "abc",
        "--page-size",
        "7",
        "--output",
        "json",
      ],
      fixture.env,
    );

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toBe(
      "--cursor continues with the filters and page size of the listing that returned it: drop " +
        "--status and --page-size.",
    );
  });
});
