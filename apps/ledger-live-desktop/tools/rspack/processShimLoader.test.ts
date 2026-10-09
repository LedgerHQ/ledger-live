import processShimLoader from "./processShimLoader.cjs";

const BINDING = "var process = globalThis.__LLD_PROCESS__;";

describe("processShimLoader", () => {
  it("should prepend the binding to a sloppy-mode module", () => {
    expect(processShimLoader("process.cwd();")).toMatch(new RegExp(`^\\s*${BINDING}`));
  });

  it.each([
    "'use strict';\nprocess.cwd();",
    "// Copyright Joyent, Inc.\n// MIT License\n\n'use strict';\nprocess.cwd();",
    '/*! banner */\n"use strict";\nprocess.cwd();',
  ])("should keep the directive first, after any banner: %j", source => {
    const output = processShimLoader(source);

    expect(output.indexOf(BINDING)).toBeGreaterThan(output.search(/['"]use strict/));
    expect(output.startsWith(source.slice(0, source.search(/['"]use strict/)))).toBe(true);
  });

  it.each([`/*${"*//*".repeat(50_000)}`, "//".repeat(50_000), `/* ${"**".repeat(50_000)}`])(
    "should reject an unterminated banner in linear time",
    source => {
      const start = performance.now();

      expect(processShimLoader(source).startsWith("\n" + BINDING)).toBe(true);
      expect(performance.now() - start).toBeLessThan(1000);
    },
  );
});
