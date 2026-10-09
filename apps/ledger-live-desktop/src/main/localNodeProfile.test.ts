import fs from "fs";
import os from "os";
import path from "path";
import { localNodeProfilePath, resetLocalNodeProfile } from "./localNodeProfile";

describe("local node profile", () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "local-node-profile-"));
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("sits next to the default profile, one per set of local currencies", () => {
    const userData = path.join(root, "Ledger Live");

    expect(localNodeProfilePath(userData, ["tron", "stellar"])).toBe(
      `${userData}-local-node-stellar-tron`,
    );
    expect(localNodeProfilePath(userData, ["stellar", "tron"])).toBe(
      localNodeProfilePath(userData, ["tron", "stellar"]),
    );
  });

  it("starts a local profile without the previous run's app data", () => {
    const userData = path.join(root, "Ledger Live");
    const profile = localNodeProfilePath(userData, ["stellar"]);
    fs.mkdirSync(userData);
    fs.mkdirSync(profile);
    fs.writeFileSync(path.join(userData, "app.json"), "mainnet");
    fs.writeFileSync(path.join(profile, "app.json"), "previous local run");
    fs.writeFileSync(path.join(profile, "windowParams.json"), "{}");

    resetLocalNodeProfile(profile);

    expect(fs.existsSync(path.join(profile, "app.json"))).toBe(false);
    expect(fs.existsSync(path.join(profile, "windowParams.json"))).toBe(true);
    expect(fs.readFileSync(path.join(userData, "app.json"), "utf8")).toBe("mainnet");
  });

  it("starts a first local run as well", () => {
    const profile = localNodeProfilePath(path.join(root, "Ledger Live"), ["stellar"]);

    expect(() => resetLocalNodeProfile(profile)).not.toThrow();
  });

  it("never resets a profile that is not a local node one", () => {
    const userData = path.join(root, "Ledger Live");
    fs.mkdirSync(userData);
    fs.writeFileSync(path.join(userData, "app.json"), "mainnet");

    expect(() => resetLocalNodeProfile(userData)).toThrow("Not a local node profile");
    expect(fs.readFileSync(path.join(userData, "app.json"), "utf8")).toBe("mainnet");
  });
});
