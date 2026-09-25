import { readFileSync } from "fs";
import path from "path";
import { loadTokenPrograms, patchAdminLiteral } from "./tokenContracts";

const MULTISIG_LITERAL = "aleo1g3v24z8ke26c0vun3ma9p56r74pqqkpshmhcjj5ywc32hmuf0sgsr7fmjx";
const FREEZELIST_STABLECOIN_LITERAL =
  "aleo1r4l65lh2ugw86hq4j7ncva42ce42z6pmsp9nlny3swqce6ya6s8qjce6mh";
const COMPLIANCE_RECORD_ADDRESS = "aleo1kzwzr0ww399q68aqguj92wcg39a8w34d55dtj65dvwm66uxesursa57z4q";
const FRESH_ADMIN = "aleo1y7eee0sqqvltswhcu3fp6p3xtw8rpfwwxftaq58ym7j7sexgjgysc0s52m";

describe("patchAdminLiteral", () => {
  it("replaces every occurrence of the listed literal for a known file", () => {
    const source = `assert.eq r0 ${MULTISIG_LITERAL};\nassert.eq program_owner ${MULTISIG_LITERAL};`;
    const patched = patchAdminLiteral(source, "test_usad_multisig_core.aleo", FRESH_ADMIN);
    expect(patched).not.toContain(MULTISIG_LITERAL);
    expect(patched.match(new RegExp(FRESH_ADMIN, "g"))).toHaveLength(2);
  });

  it("throws when the listed literal is absent", () => {
    expect(() =>
      patchAdminLiteral(
        "assert.eq r0 aleo1somethingElse;",
        "test_usad_freezelist.aleo",
        FRESH_ADMIN,
      ),
    ).toThrow(/aleo1r4l65lh/);
  });

  it("leaves a file with no patch entry unchanged", () => {
    const source = "program merkle_tree.aleo;\n";
    expect(patchAdminLiteral(source, "merkle_tree.aleo", FRESH_ADMIN)).toBe(source);
  });
});

describe("loadTokenPrograms", () => {
  it("patches the real stablecoin source and leaves the ComplianceRecord address untouched", () => {
    const [, , , stablecoin] = loadTokenPrograms(FRESH_ADMIN);
    expect(stablecoin.id).toBe("test_usad_stablecoin.aleo");
    expect(stablecoin.source).not.toContain(FREEZELIST_STABLECOIN_LITERAL);
    expect(stablecoin.source).toContain(FRESH_ADMIN);
    expect(stablecoin.source.match(new RegExp(COMPLIANCE_RECORD_ADDRESS, "g"))).toHaveLength(7);
  });

  it("returns the four programs in deploy order", () => {
    const programs = loadTokenPrograms(FRESH_ADMIN);
    expect(programs.map(p => p.id)).toStrictEqual([
      "merkle_tree.aleo",
      "test_usad_multisig_core.aleo",
      "test_usad_freezelist.aleo",
      "test_usad_stablecoin.aleo",
    ]);
  });

  it("matches the raw file on disk once patched back", () => {
    const raw = readFileSync(
      path.join(__dirname, "../aleo-backend/contracts/test_usad_freezelist.aleo"),
      "utf8",
    );
    const [, , freezelist] = loadTokenPrograms(FRESH_ADMIN);
    expect(freezelist.source.replaceAll(FRESH_ADMIN, FREEZELIST_STABLECOIN_LITERAL)).toBe(raw);
  });
});
