import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PARSED_PROGRAMS } from "./program/constants";
import type { ChainAPI } from "../index";
import { buildCreateAssociatedTokenAccountInstruction, getPriorityFee } from "./web3";

const OWNER = "7V4CBuNyQaAhZVHf3fgsNxpk32bR61XRVZuAdR7isRu9";
const MINT = "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9";
const ATA = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

const mockApi = (fees: number[], minPriorityFee?: number) =>
  ({
    config: { endpoint: "", minPriorityFee },
    getRecentPrioritizationFees: jest
      .fn()
      .mockResolvedValue(fees.map(prioritizationFee => ({ slot: 0, prioritizationFee }))),
    getSimulationComputeUnits: jest.fn().mockResolvedValue(null),
  }) as unknown as ChainAPI;

describe("getPriorityFee", () => {
  it.each([
    ["falls back to the default floor when the median is 0", [0, 0, 0], undefined, 10_000],
    ["falls back to the default floor when there is no sample", [], undefined, 10_000],
    ["uses the configured floor", [0], 25_000, 25_000],
    ["keeps a median above the floor", [50_000], undefined, 50_000],
    ["takes the middle sample of an odd count", [0, 90_000, 30_000], undefined, 30_000],
    [
      "averages the two middle samples of an even count",
      [0, 20_000, 40_000, 90_000],
      undefined,
      30_000,
    ],
    ["rounds a fractional median up to an integer", [20_001, 20_002], undefined, 20_002],
    ["ignores a non-positive configured floor", [0], 0, 10_000],
  ])("%s", async (_, fees, minPriorityFee, expected) => {
    expect(await getPriorityFee(mockApi(fees, minPriorityFee), [OWNER])).toBe(expected);
  });
});

describe("buildCreateAssociatedTokenAccountInstruction", () => {
  it.each([
    [PARSED_PROGRAMS.SPL_TOKEN, TOKEN_PROGRAM_ID],
    [PARSED_PROGRAMS.SPL_TOKEN_2022, TOKEN_2022_PROGRAM_ID],
  ] as const)("creates the account under %s", async (tokenProgram, expected) => {
    // The compute-unit price instruction is prepended, so the ATA creation is the last one.
    const [, instruction] = await buildCreateAssociatedTokenAccountInstruction(mockApi([]), {
      kind: "token.createATA",
      owner: OWNER,
      mint: MINT,
      associatedTokenAccountAddress: ATA,
      tokenProgram,
    });

    expect(instruction.keys.some(key => key.pubkey.equals(expected))).toBe(true);
  });
});
