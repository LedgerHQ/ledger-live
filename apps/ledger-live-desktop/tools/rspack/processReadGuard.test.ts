import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ProcessReadGuard from "./processReadGuard.cjs";

const { findUnguarded, findUnguardedGlobals } = ProcessReadGuard;

describe("processReadGuard", () => {
  it.each([
    'typeof process!=="undefined"&&process.cwd()',
    '"undefined"!=typeof process?process.cwd():0',
    'if(typeof process<"u"){a();process.cwd()}',
    "globalThis.process?.cwd()",
    'typeof process>"u"?0:process.cwd()',
    'typeof process>"u"||process.cwd()',
    'if(typeof process>"u"){}else{process.cwd()}',
    'if(typeof process!=="undefined")process.cwd()',
    'if(typeof process>"u")a();else process.cwd()',
    'typeof process<"u"&&f({a:1})&&process.cwd()',
    'typeof process<"u"?f({a:1}).cwd&&process.cwd():0',
    'if(typeof process<"u")a(),process.cwd()',
    '(typeof process<"u")&&process.cwd()',
    "if(globalThis.process!==void 0)process.cwd()",
    "!!n.g.process&&process.cwd()",
    "globalThis.process!=null&&process.cwd()",
    'typeof process<"u"&&x&&process.cwd()',
    'typeof process>"u"||x&&process.cwd()',
    'typeof process<"u"&&x?process.cwd():0',
    'typeof process<"u"?a?0:process.cwd():0',
    'if(typeof process<"u"&&x)process.cwd()',
    'if(typeof process<"u")if(x)process.cwd()',
    "process.env.NODE_ENV",
  ])("should accept a guarded or rewritten read: %s", code => {
    expect(findUnguarded(code)).toEqual([]);
  });

  it.each([
    "process.cwd()",
    "typeof process; process.cwd()",
    "globalThis.process;process.cwd()",
    'typeof process!=="undefined";process.cwd()',
    'typeof process==="undefined"&&process.cwd()',
    'typeof process>"u"&&process.cwd()',
    '"undefined"!=typeof process?0:process.cwd()',
    'if(typeof process<"u"){a()}process.cwd()',
    'if(typeof process<"u")a();else process.cwd()',
    "if(!globalThis.process)process.cwd()",
    "if(!n.g.process)process.cwd()",
    "globalThis.process===undefined?process.cwd():0",
    "globalThis.process===x&&process.cwd()",
    "globalThis.processed&&process.cwd()",
    "typeof process===void 0&&process.cwd()",
    'f(typeof process<"u"),process.cwd()',
    'typeof process<"u",process.cwd()',
    'if(typeof process<"u"||x)process.cwd()',
    "globalThis.process!==null&&process.cwd()",
    "null===globalThis.process||process.cwd()",
    'typeof process<"u"&&x||process.cwd()',
    'typeof process<"u"&&x?0:process.cwd()',
    'typeof process>"u"?a?0:process.cwd():0',
    'x?typeof process<"u"&&a:process.cwd()',
    'x?typeof process>"u"||a:process.cwd()',
    '(typeof process>"u"&&a)||process.cwd()',
    'if(typeof process>"u"&&x)a();else process.cwd()',
    'if(typeof process>"u")if(x)a();else process.cwd()',
    'typeof process<"u"||function(){process.cwd()}',
    'typeof process<"z"&&process.cwd()',
    '"a"<typeof process&&process.cwd()',
  ])("should flag a read no guard protects: %s", code => {
    expect(findUnguarded(code)).toEqual([expect.objectContaining({ property: "cwd" })]);
  });

  it.each([
    "typeof setImmediate",
    '"function"==typeof setImmediate?setImmediate(f):0',
    '"function"!=typeof setImmediate?0:setImmediate(f)',
    'if(typeof setImmediate=="function")setImmediate(f)',
    "{setImmediate:1}",
    "utils.setImmediate(f)",
  ])("should accept a safe timer reference: %s", code => {
    expect(findUnguardedGlobals(code)).toEqual([]);
  });

  it.each([
    "setImmediate(f)",
    "typeof setImmediate;setImmediate(f)",
    'typeof setImmediate==="undefined"&&setImmediate(f)',
    "if(!globalThis.setImmediate)setImmediate(f)",
    "globalThis.setImmediatePolyfill&&setImmediate(f)",
    'f(typeof setImmediate<"u"),setImmediate(f)',
    'typeof setImmediate<"u"&&x||setImmediate(f)',
    "globalThis.setImmediate!==null&&setImmediate(f)",
    'typeof setImmediate<"z"&&setImmediate(f)',
  ])("should flag a bare timer call: %s", code => {
    expect(findUnguardedGlobals(code)).toEqual([
      expect.objectContaining({ property: "setImmediate" }),
    ]);
  });
});

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function vlq(value: number) {
  let rest = value < 0 ? (-value << 1) | 1 : value << 1;
  let out = "";
  do {
    const digit = rest & 31;
    rest >>>= 5;
    out += B64[rest ? digit | 32 : digit];
  } while (rest);
  return out;
}

function encodeLine(segments: [number, number | null][]) {
  let column = 0;
  let source = 0;
  return segments
    .map(([generatedColumn, sourceIndex]) => {
      const field = vlq(generatedColumn - column);
      column = generatedColumn;
      if (sourceIndex === null) return field;
      const segment = field + vlq(sourceIndex - source) + vlq(0) + vlq(0);
      source = sourceIndex;
      return segment;
    })
    .join(",");
}

const SAFER =
  "webpack://lld/../../node_modules/.pnpm/safer-buffer@2.1.2/node_modules/safer-buffer/safer.js";
const UNLISTED = "webpack://lld/../../node_modules/unlisted/index.js";

type Compilation = {
  outputOptions: { path: string };
  assets: Record<string, unknown>;
  errors: Error[];
  warnings: Error[];
};

async function runGuard(
  code: string,
  map: { sources: string[]; segments: [number, number | null][] } | null,
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "process-read-guard-"));
  try {
    fs.writeFileSync(path.join(dir, "renderer.js"), code);
    if (map) {
      fs.writeFileSync(
        path.join(dir, "renderer.js.map"),
        JSON.stringify({
          version: 3,
          sources: map.sources,
          names: [],
          mappings: encodeLine(map.segments),
        }),
      );
    }
    type AfterEmit = (compilation: Compilation) => Promise<void>;
    let afterEmit: AfterEmit | undefined;
    new ProcessReadGuard().apply({
      hooks: { afterEmit: { tapPromise: (_: string, fn: AfterEmit) => (afterEmit = fn) } },
    });
    const compilation: Compilation = {
      outputOptions: { path: dir },
      assets: { "renderer.js": {} },
      errors: [],
      warnings: [],
    };
    if (!afterEmit) throw new Error("ProcessReadGuard did not tap afterEmit");
    await afterEmit(compilation);
    return {
      errors: compilation.errors.map(error => error.message),
      warnings: compilation.warnings.map(warning => warning.message),
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe("ProcessReadGuard plugin", () => {
  const read = 'process.binding("a");';

  it("should accept an allowed read up to its max", async () => {
    const { errors, warnings } = await runGuard(read, { sources: [SAFER], segments: [[0, 0]] });

    expect(errors).toEqual([]);
    expect(warnings.join("\n")).not.toContain("safer-buffer/safer.js");
  });

  it("should reject an allowed read over its max", async () => {
    const { errors } = await runGuard(read + read, { sources: [SAFER], segments: [[0, 0]] });

    expect(errors).toEqual([
      expect.stringContaining("safer-buffer/safer.js :: binding   2 hit(s), 1 allowed"),
    ]);
  });

  it("should reject a read from a source missing from ALLOWED", async () => {
    const { errors } = await runGuard(read, { sources: [UNLISTED], segments: [[0, 0]] });

    expect(errors).toEqual([expect.stringContaining("unlisted/index.js :: binding")]);
  });

  it("should not attribute an unmapped segment to the previous source", async () => {
    const { errors } = await runGuard(`x();${read}`, {
      sources: [SAFER],
      segments: [
        [0, 0],
        [4, null],
      ],
    });

    expect(errors).toEqual([
      expect.stringContaining("renderer.js :: binding   1 hit(s), 0 allowed"),
    ]);
  });

  it("should warn when an allowed entry finds fewer hits than its max", async () => {
    const { warnings } = await runGuard(read, { sources: [UNLISTED], segments: [[0, 0]] });

    expect(warnings).toContainEqual(
      expect.stringContaining('"safer-buffer/safer.js :: binding" allows 1 hit(s), found 0'),
    );
  });

  it("should fail when the chunk has no source map", async () => {
    const { errors } = await runGuard(read, null);

    expect(errors).toEqual([expect.stringContaining("needs a source map for renderer.js")]);
  });
});
