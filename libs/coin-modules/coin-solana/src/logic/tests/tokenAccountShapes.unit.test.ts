import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { PARSED_PROGRAMS } from "../../network/chain/program/constants";
import { getTokenAccountProgramId } from "../../helpers/token";
import { getTokenAccountShapes } from "../tokenAccountShapes";

const OWNER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const ataOf = (mint: string, program = PARSED_PROGRAMS.SPL_TOKEN) =>
  getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(OWNER),
    undefined,
    getTokenAccountProgramId(program),
  );

function tokenAccount(pubkey: PublicKey, state: string, extensions?: unknown[]) {
  return {
    pubkey,
    account: {
      data: {
        parsed: {
          info: {
            mint: MINT,
            owner: OWNER,
            state,
            isNative: false,
            tokenAmount: { amount: "1000", decimals: 6, uiAmount: 0.001, uiAmountString: "0.001" },
            ...(extensions ? { extensions } : {}),
          },
          type: "account",
        },
        program: "spl-token",
        space: 165,
      },
    },
  };
}

function makeApi(splAccounts: unknown[], token2022Accounts: unknown[] = []): ChainAPI {
  return {
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: splAccounts }),
    getParsedToken2022AccountsByOwner: jest.fn().mockResolvedValue({ value: token2022Accounts }),
    getAccountInfo: jest.fn().mockResolvedValue(null),
    getEpochInfo: jest.fn().mockResolvedValue({ epoch: 0 }),
  } as unknown as ChainAPI;
}

describe("getTokenAccountShapes", () => {
  it("reports the frozen state of an associated token account", async () => {
    const api = makeApi([tokenAccount(ataOf(MINT), "frozen")]);

    const shapes = await getTokenAccountShapes(api, OWNER);

    expect(shapes[MINT]).toEqual({ state: "frozen" });
  });

  // An owner can hold several accounts for one mint; the shape must be the associated one's, not
  // whichever request settled last.
  it("ignores a token account that is not the associated one", async () => {
    const stranger = new PublicKey("9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b");
    // The stranger last: without the filter it is the one that lands in the map.
    const api = makeApi([
      tokenAccount(ataOf(MINT), "initialized"),
      tokenAccount(stranger, "frozen"),
    ]);

    const shapes = await getTokenAccountShapes(api, OWNER);

    expect(shapes[MINT]).toEqual({ state: "initialized" });
  });

  it("reports no extensions for a classic SPL account", async () => {
    const api = makeApi([tokenAccount(ataOf(MINT), "initialized")]);

    const shapes = await getTokenAccountShapes(api, OWNER);

    expect(shapes[MINT]).not.toHaveProperty("extensions");
  });

  // `toSolanaTokenAccExtensions` reads `mint`/`owner` as `PublicKey`; reaching it with the raw
  // parsed strings would throw on the interest-bearing branch.
  it("maps a token account extension through the parser", async () => {
    const api = makeApi([
      tokenAccount(ataOf(MINT), "initialized", [
        { extension: "memoTransfer", state: { requireIncomingTransferMemos: true } },
      ]),
    ]);

    const shapes = await getTokenAccountShapes(api, OWNER);

    expect(shapes[MINT].extensions).toEqual({ requiredMemoOnTransfer: true });
  });
});
