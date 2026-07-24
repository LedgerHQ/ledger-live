const execFileMock = jest.fn();

jest.mock("child_process", () => ({
  execFile: (
    file: string,
    args: string[],
    opts: unknown,
    cb: (err: Error | null, res: { stdout: string; stderr: string }) => void,
  ) => {
    execFileMock(file, args);
    cb(null, { stdout: "", stderr: "" });
  },
}));

import { deploySolo, teardownSolo } from "./solo";

// `killPortForwards()` runs pgrep/ps/kill through the same mock; only the deploy call is of interest.
const deployCalls = () => execFileMock.mock.calls.filter(([, args]) => args[2] === "deploy");

describe("deploySolo memoisation", () => {
  beforeEach(() => {
    execFileMock.mockClear();
    execFileMock.mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await teardownSolo();
  });

  it("shells out to `solo one-shot falcon deploy` exactly once for repeated calls", async () => {
    await deploySolo();
    await deploySolo();
    await deploySolo();

    expect(deployCalls()).toHaveLength(1);
    expect(deployCalls()[0][1]).toEqual([
      "one-shot",
      "falcon",
      "deploy",
      "--deployment",
      "coin-tester-hedera",
      "--namespace",
      "coin-tester-hedera",
      "--no-deploy-relay",
      "--no-deploy-explorer",
      "--quiet-mode",
    ]);
  });

  it("deploys again after teardown, so a second suite run is not silently a no-op", async () => {
    await deploySolo();
    await teardownSolo();
    await deploySolo();

    expect(deployCalls()).toHaveLength(2);
  });

  it("caches a failed deploy, so an environment failure does not trigger a second 10-minute attempt", async () => {
    execFileMock.mockImplementation((_file: string, args: string[]) => {
      if (args[2] === "deploy") throw new Error("cluster bring-up failed");
    });

    await expect(deploySolo()).rejects.toThrow("cluster bring-up failed");
    await expect(deploySolo()).rejects.toThrow("cluster bring-up failed");

    expect(deployCalls()).toHaveLength(1);
  });

  it("tears down via `solo one-shot falcon destroy`", async () => {
    await deploySolo();
    execFileMock.mockClear();
    await teardownSolo();

    const destroyCalls = execFileMock.mock.calls.filter(([, args]) => args[2] === "destroy");
    expect(destroyCalls).toHaveLength(1);
    expect(destroyCalls[0][1]).toEqual([
      "one-shot",
      "falcon",
      "destroy",
      "--deployment",
      "coin-tester-hedera",
      "--quiet-mode",
    ]);
  });
});
