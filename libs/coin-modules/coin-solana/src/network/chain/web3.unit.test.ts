import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PARSED_PROGRAMS } from "./program/constants";
import type { ChainAPI } from "../index";
import { buildCreateAssociatedTokenAccountInstruction, getPriorityFee } from "./web3";

const OWNER = "7V4CBuNyQaAhZVHf3fgsNxpk32bR61XRVZuAdR7isRu9";
const MINT = "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9";
const ATA = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

const api = {
  getRecentPrioritizationFees: jest.fn().mockResolvedValue([]),
  getSimulationComputeUnits: jest.fn().mockResolvedValue(null),
} as unknown as ChainAPI;

describe("getPriorityFee", () => {
  it.each([
    [[30_000], 30_000],
    [[20_001, 20_002], 20_002],
  ])("returns %d for recent fees %j", async (fees, expected) => {
    const priorityFeeApi = {
      getRecentPrioritizationFees: jest
        .fn()
        .mockResolvedValue(fees.map(prioritizationFee => ({ prioritizationFee }))),
    } as unknown as ChainAPI;

    await expect(getPriorityFee(priorityFeeApi, [OWNER])).resolves.toBe(expected);
  });
});

describe("buildCreateAssociatedTokenAccountInstruction", () => {
  it.each([
    [PARSED_PROGRAMS.SPL_TOKEN, TOKEN_PROGRAM_ID],
    [PARSED_PROGRAMS.SPL_TOKEN_2022, TOKEN_2022_PROGRAM_ID],
  ] as const)("creates the account under %s", async (tokenProgram, expected) => {
    const [instruction] = await buildCreateAssociatedTokenAccountInstruction(
      api,
      {
        kind: "token.createATA",
        owner: OWNER,
        mint: MINT,
        associatedTokenAccountAddress: ATA,
        tokenProgram,
      },
      0.1,
    );

    expect(instruction.keys.some(key => key.pubkey.equals(expected))).toBe(true);
  });
});
