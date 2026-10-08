import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import RendererEnvGuard from "./rendererEnvGuard.cjs";

const { findEnvUses, findWithheld } = RendererEnvGuard;

const ENV = "globalThis.__LLD_PROCESS_ENV__";
const APP = "webpack://ledger-live-desktop/./src/renderer/Some.tsx";
const WINDOW_CONSTANTS = "webpack://ledger-live-desktop/./src/config/windowConstants.ts";

type Compilation = {
  outputOptions: { path: string };
  assets: Record<string, unknown>;
  errors: Error[];
  warnings: Error[];
};

async function runGuard(code: string, source: string | null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "renderer-env-guard-"));
  try {
    fs.writeFileSync(path.join(dir, "renderer.js"), code);
    if (source) {
      fs.writeFileSync(
        path.join(dir, "renderer.js.map"),
        JSON.stringify({ version: 3, sources: [source], names: [], mappings: "AAAA" }),
      );
    }
    type AfterEmit = (compilation: Compilation) => Promise<void>;
    let afterEmit: AfterEmit | undefined;
    new RendererEnvGuard().apply({
      hooks: { afterEmit: { tapPromise: (_: string, fn: AfterEmit) => (afterEmit = fn) } },
    });
    const compilation: Compilation = {
      outputOptions: { path: dir },
      assets: { "renderer.js": {} },
      errors: [],
      warnings: [],
    };
    if (!afterEmit) throw new Error("RendererEnvGuard did not tap afterEmit");
    await afterEmit(compilation);
    return {
      errors: compilation.errors.map(error => error.message),
      warnings: compilation.warnings.map(warning => warning.message),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("findEnvUses", () => {
  it.each([
    [`${ENV}.MOCK`, "MOCK"],
    [`${ENV}?.SPECULOS_ADDRESS`, "SPECULOS_ADDRESS"],
    [`${ENV}["DEBUG_THEME"]`, "DEBUG_THEME"],
    [`${ENV}?.['DEBUG_THEME']`, "DEBUG_THEME"],
  ])("should read the key of %s", (code, key) => {
    expect(findEnvUses(code)).toEqual({ reads: [{ index: 0, key }], opaque: [] });
  });

  it.each([`${ENV}[e]`, `e in ${ENV}`, `return ${ENV}`, `void 0!==${ENV}&&x`])(
    "should report a keyless use in %s",
    code => {
      expect(findEnvUses(code)).toEqual({ reads: [], opaque: [code.indexOf(ENV)] });
    },
  );

  it.each(["en.__LLD_PROCESS_ENV__.MOCK", `${ENV}_X.MOCK`, "globalThis.__LLD_PROCESS__.env.MOCK"])(
    "should ignore %s",
    code => {
      expect(findEnvUses(code)).toEqual({ reads: [], opaque: [] });
    },
  );
});

describe("findWithheld", () => {
  it.each(['getEnv("SEED")', "getEnv('SEED')", `${ENV}.SEED`, `${ENV}?.SEED`])(
    "should find the withheld key in %s",
    code => {
      expect(findWithheld(code)).toEqual([{ index: expect.any(Number), key: "SEED" }]);
    },
  );

  it.each(['"MOCK_SERVER_SEED"', '"SEEDS"', "x.SEED", `${ENV}.SEED_X`])(
    "should ignore %s",
    code => {
      expect(findWithheld(code)).toEqual([]);
    },
  );
});

describe("RendererEnvGuard plugin", () => {
  it("should accept forwarded, build-time and withheld keys", async () => {
    const code = `${ENV}.MOCK;${ENV}.CARD_BAANX_API_URL;${ENV}.NODE_DEBUG;`;

    expect((await runGuard(code, APP)).errors).toEqual([]);
  });

  it("should reject a key in none of the lists, naming where it is read", async () => {
    const { errors } = await runGuard(`${ENV}.MOCK;${ENV}.NEW_FLAG;`, APP);

    expect(errors).toEqual([expect.stringContaining("NEW_FLAG   read by src/renderer/Some.tsx")]);
    expect(errors[0]).not.toContain("MOCK ");
  });

  it.each(['getEnv("SEED");', `${ENV}.SEED;`])(
    "should reject a mention of a withheld key once: %s",
    async code => {
      const { errors } = await runGuard(code, APP);

      expect(errors).toEqual([
        expect.stringContaining("SEED   WITHHELD, but named by src/renderer/Some.tsx"),
      ]);
      expect(errors[0]).not.toContain("SEED   read by");
    },
  );

  it("should accept a keyless use from a listed origin up to its max", async () => {
    const { errors } = await runGuard(`${ENV}[e];`, WINDOW_CONSTANTS);

    expect(errors).toEqual([]);
  });

  it("should reject a keyless use over its max", async () => {
    const { errors } = await runGuard(`${ENV}[e];${ENV}[a];`, WINDOW_CONSTANTS);

    expect(errors).toEqual([
      expect.stringContaining("src/config/windowConstants.ts   2 keyless use(s), 1 allowed"),
    ]);
  });

  it("should reject a keyless use from an unlisted origin", async () => {
    const { errors } = await runGuard(`${ENV}[e];`, APP);

    expect(errors).toEqual([
      expect.stringContaining("src/renderer/Some.tsx   1 keyless use(s), 0 allowed"),
    ]);
  });

  it("should warn when an OPAQUE entry finds fewer uses than its max", async () => {
    const { warnings } = await runGuard(`${ENV}.MOCK;`, APP);

    expect(warnings).toContainEqual(
      expect.stringContaining('"src/config/windowConstants.ts" allows 1 use(s), found 0'),
    );
  });

  it("should fail when a chunk to attribute has no source map", async () => {
    const { errors } = await runGuard(`${ENV}.NEW_FLAG;`, null);

    expect(errors).toEqual([expect.stringContaining("needs a source map for renderer.js")]);
  });
});
