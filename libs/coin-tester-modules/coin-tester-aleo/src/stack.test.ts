import { execFileSync } from "child_process";
import * as compose from "docker-compose";
import { resetBlockCache } from "./devnode";
import { resetSponsor } from "./msw/sponsor";
import { killStack, spawnStack } from "./stack";

jest.mock("child_process", () => ({ execFileSync: jest.fn() }));
jest.mock("docker-compose", () => ({
  down: jest.fn(),
  buildAll: jest.fn(),
  upAll: jest.fn(),
}));
jest.mock("./devnode", () => ({
  ...jest.requireActual("./devnode"),
  resetBlockCache: jest.fn(),
}));
jest.mock("./msw/sponsor", () => ({ resetSponsor: jest.fn() }));

describe("killStack", () => {
  const exitHooks: Array<() => void> = [];

  beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(process, "on").mockImplementation(((event: string, listener: () => void) => {
      if (event === "exit") exitHooks.push(listener);
      return process;
    }) as typeof process.on);
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, text: async () => "0" } as unknown as Response);

    await spawnStack();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("keeps the exit hook's sync fallback armed when compose down fails", async () => {
    jest.mocked(compose.down).mockRejectedValueOnce(new Error("compose down failed"));

    await expect(killStack()).rejects.toThrow("compose down failed");
    exitHooks.forEach(hook => hook());

    expect(execFileSync).toHaveBeenCalledWith(
      "docker",
      ["rm", "-f", "aleo-devnode", "aleo-backend"],
      expect.anything(),
    );
  });
});

describe("spawnStack", () => {
  it("forgets the blocks and the sponsor of any previous stack", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, text: async () => "0" } as unknown as Response);
    jest.mocked(resetBlockCache).mockClear();
    jest.mocked(resetSponsor).mockClear();

    await spawnStack();

    expect(resetBlockCache).toHaveBeenCalled();
    expect(resetSponsor).toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
