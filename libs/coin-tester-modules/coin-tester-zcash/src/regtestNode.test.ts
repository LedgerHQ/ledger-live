import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as compose from "docker-compose";
import { randomMainnetBurnAddress } from "./regtestAddress";
import { killRegtestNode, spawnRegtestNode, writeZebraConfig } from "./regtestNode";

jest.mock("docker-compose", () => ({
  upAll: jest.fn().mockResolvedValue(undefined),
  down: jest.fn().mockResolvedValue(undefined),
}));

const TEMPLATE_PATH = path.resolve(__dirname, "docker", "zebra.toml.template");

const nu7Lines = (config: string) => config.split("\n").filter(line => /^NU7\s*=/.test(line));

describe("writeZebraConfig", () => {
  let dockerDir: string;

  beforeEach(() => {
    dockerDir = fs.mkdtempSync(path.join(os.tmpdir(), "zebra-config-"));
    fs.copyFileSync(TEMPLATE_PATH, path.join(dockerDir, "zebra.toml.template"));
  });

  afterEach(() => {
    fs.rmSync(dockerDir, { recursive: true, force: true });
  });

  const readConfig = () => fs.readFileSync(path.join(dockerDir, "zebra.toml"), "utf8");

  it("schedules NU7 at the given height, exactly once, with no placeholder left", () => {
    writeZebraConfig(randomMainnetBurnAddress(), 140, dockerDir);

    const config = readConfig();
    expect(nu7Lines(config)).toEqual(["NU7 = 140"]);
    expect(config).not.toContain("{{");
  });

  it("leaves NU7 unscheduled when no height is given", () => {
    writeZebraConfig(randomMainnetBurnAddress(), undefined, dockerDir);

    const config = readConfig();
    expect(nu7Lines(config)).toEqual([]);
    expect(config).not.toContain("{{");
  });

  it("writes the miner address in its regtest encoding", () => {
    const minerAddress = randomMainnetBurnAddress();
    writeZebraConfig(minerAddress, undefined, dockerDir);

    const match = readConfig().match(/^miner_address = "(.+)"$/m);
    expect(match).not.toBeNull();
    expect(match?.[1]).not.toBe(minerAddress);
  });
});

describe("spawnRegtestNode / killRegtestNode", () => {
  const dockerDir = path.resolve(__dirname, "docker");
  const writtenConfig = path.join(dockerDir, "zebra.toml");

  afterEach(() => {
    fs.rmSync(writtenConfig, { force: true });
  });

  it("schedules NU7 in the config zebra starts from, then brings the stack up and waits", async () => {
    await spawnRegtestNode(randomMainnetBurnAddress(), { nu7ActivationHeight: 140 });

    expect(nu7Lines(fs.readFileSync(writtenConfig, "utf8"))).toEqual(["NU7 = 140"]);
    expect(compose.upAll).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: dockerDir, commandOptions: ["--wait"] }),
    );
  });

  it("leaves NU7 out of the config when started without options", async () => {
    await spawnRegtestNode(randomMainnetBurnAddress());

    expect(nu7Lines(fs.readFileSync(writtenConfig, "utf8"))).toEqual([]);
  });

  it("tears the stack down with its volumes", async () => {
    await killRegtestNode();

    expect(compose.down).toHaveBeenCalledWith(
      expect.objectContaining({ commandOptions: ["--remove-orphans", "--volumes"] }),
    );
  });
});
