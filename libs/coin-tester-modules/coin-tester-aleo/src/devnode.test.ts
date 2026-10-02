import { resolveProgramImports, parseFutureArguments, parseFutureSender } from "./devnode";
import type { DevnodeTransition } from "./devnode";

// Mock fetch to avoid needing a live devnode
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("resolveProgramImports", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("resolves direct and transitive imports into one flat map", async () => {
    const sources: Record<string, string> = {
      "b.aleo": "program b.aleo;\n\nfunction f:\n",
      "a.aleo": "import b.aleo;\nprogram a.aleo;\n\nfunction f:\n",
    };

    mockFetch.mockImplementation(async (url: string) => {
      const programId = (url as string).match(/\/program\/([^/]+)/)?.[1];
      if (programId && sources[programId]) {
        return {
          ok: true,
          json: async () => sources[programId],
        } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const imports = await resolveProgramImports("import a.aleo;\nprogram c.aleo;\n\nfunction f:\n");

    expect(imports).toStrictEqual({ "a.aleo": sources["a.aleo"], "b.aleo": sources["b.aleo"] });
  });

  it("returns an empty map for a source with no imports", async () => {
    const imports = await resolveProgramImports("program merkle_tree.aleo;\n\nfunction f:\n");
    expect(imports).toStrictEqual({});
  });

  it("handles circular import graphs without infinite recursion", async () => {
    const sources: Record<string, string> = {
      "a.aleo": "import b.aleo;\nprogram a.aleo;\n\nfunction f:\n",
      "b.aleo": "import a.aleo;\nprogram b.aleo;\n\nfunction f:\n",
    };

    mockFetch.mockImplementation(async (url: string) => {
      const programId = (url as string).match(/\/program\/([^/]+)/)?.[1];
      if (programId && sources[programId]) {
        return {
          ok: true,
          json: async () => sources[programId],
        } as Response;
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const imports = await resolveProgramImports("import a.aleo;\nprogram c.aleo;\n\nfunction f:\n");

    // Should resolve both a and b exactly once, with no stack overflow
    expect(imports).toStrictEqual({ "a.aleo": sources["a.aleo"], "b.aleo": sources["b.aleo"] });
  });
});

function transitionWithFuture(argumentsLiteral: string): DevnodeTransition {
  return {
    id: "au1test",
    program: "test_usad_stablecoin.aleo",
    function: "transfer_public",
    inputs: [],
    outputs: [
      {
        type: "future",
        id: "1field",
        value: `{\n  program_id: test_usad_stablecoin.aleo,\n  function_name: transfer_public,\n  arguments: [\n    ${argumentsLiteral}\n  ]\n}`,
      },
    ],
    tpk: "",
    tcm: "",
    scm: "",
  };
}

describe("parseFutureArguments / parseFutureSender", () => {
  it("reads every top-level argument in order", () => {
    const transition = transitionWithFuture(
      "aleo1recipient000000000000000000000000000000000000000000000000, 250000000u128, aleo1sender0000000000000000000000000000000000000000000000000000",
    );
    expect(parseFutureArguments(transition)).toStrictEqual([
      "aleo1recipient000000000000000000000000000000000000000000000000",
      "250000000u128",
      "aleo1sender0000000000000000000000000000000000000000000000000000",
    ]);
  });

  it("parseFutureSender still reads argument 0 for a credits.aleo-shaped future", () => {
    const transition = transitionWithFuture(
      "aleo1sender0000000000000000000000000000000000000000000000000000, aleo1recipient000000000000000000000000000000000000000000000000, 1000000u64",
    );
    expect(parseFutureSender(transition)).toBe(
      "aleo1sender0000000000000000000000000000000000000000000000000000",
    );
  });
});
