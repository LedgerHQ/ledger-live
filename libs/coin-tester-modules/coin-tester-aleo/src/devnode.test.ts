import {
  getBlocksFrom,
  parseFutureArguments,
  parseFutureSender,
  resetBlockCache,
  resolveProgramImports,
  waitForPublicBalance,
} from "./devnode";
import type { DevnodeTransition } from "./devnode";

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

  it("parseFutureSender reads the sender from the argument index it is given", () => {
    const transition = transitionWithFuture(
      "aleo1recipient000000000000000000000000000000000000000000000000, 250000000u128, aleo1sender0000000000000000000000000000000000000000000000000000",
    );
    expect(parseFutureSender(transition, 2)).toBe(
      "aleo1sender0000000000000000000000000000000000000000000000000000",
    );
  });

  it("parseFutureSender throws when the argument at that index is not an address", () => {
    const transition = transitionWithFuture("aleo1recipient0000, 250000000u128");
    expect(() => parseFutureSender(transition, 1)).toThrow(/could not read the sender address/);
  });
});

describe("getBlocksFrom", () => {
  let latestHeight: number;
  let blockRequests: number[];

  beforeEach(() => {
    resetBlockCache();
    latestHeight = 2;
    blockRequests = [];
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.endsWith("/block/height/latest")) {
        return { ok: true, text: async () => String(latestHeight) } as Response;
      }
      const height = Number(url.match(/\/block\/(\d+)$/)?.[1]);
      blockRequests.push(height);
      return { ok: true, json: async () => ({ header: { metadata: { height } } }) } as Response;
    });
  });

  const heights = (blocks: { header: { metadata: { height: number } } }[]) =>
    blocks.map(block => block.header.metadata.height);

  it("returns the blocks from the given height to the tip", async () => {
    expect(heights(await getBlocksFrom(1))).toStrictEqual([1, 2]);
  });

  it("fetches each sealed block once across calls", async () => {
    await getBlocksFrom(0);
    latestHeight = 3;

    expect(heights(await getBlocksFrom(0))).toStrictEqual([0, 1, 2, 3]);
    expect(blockRequests).toStrictEqual([0, 1, 2, 3]);
  });

  it("refetches every block after a reset", async () => {
    await getBlocksFrom(0);
    resetBlockCache();
    await getBlocksFrom(0);

    expect(blockRequests).toStrictEqual([0, 1, 2, 0, 1, 2]);
  });
});

describe("waitForPublicBalance", () => {
  let balances: (string | null)[];
  let blocksCreated: number;

  beforeEach(() => {
    blocksCreated = 0;
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.endsWith("/block/create")) {
        blocksCreated++;
        return { ok: true } as Response;
      }
      if (url.endsWith("/block/height/latest")) {
        return { ok: true, text: async () => String(blocksCreated) } as Response;
      }
      return { ok: true, json: async () => balances.shift() ?? null } as Response;
    });
  });

  it("seals a block before every read until the balance is reached", async () => {
    balances = [null, "500u64", "1000u64"];

    await waitForPublicBalance("aleo1owner", 1000n);

    expect(blocksCreated).toBe(3);
  });

  it("gives up after ten blocks", async () => {
    balances = [];

    await expect(waitForPublicBalance("aleo1owner", 1n)).rejects.toThrow(/never reached 1/);
    expect(blocksCreated).toBe(10);
  });
});
