import type { CommandOutput } from "../output";
import { writeStderr } from "../shared/ui";
import { toChecksumAddress } from "./evm";
import type { IntentNetwork } from "./send-intent";
import {
  findAccountTokens,
  findTokensByTicker,
  MAX_CANDIDATES,
  sameTicker,
  type TokenCandidate,
} from "./token-lookup";

const TOKEN_KIND = { ethereum: "ERC-20 token", solana: "SPL token" } as const;
const MAINNET = { ethereum: "Ethereum mainnet", solana: "Solana mainnet" } as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function listCandidates(tokens: TokenCandidate[]): string {
  const more = tokens.length >= MAX_CANDIDATES ? "\n  … and maybe more" : "";
  return tokens.map(token => `\n  ${token.address} (${token.name})`).join("") + more;
}

function checksummed(network: IntentNetwork, tokens: TokenCandidate[]): TokenCandidate[] {
  if (network !== "ethereum") return tokens;
  return tokens.map(token => ({ ...token, address: toChecksumAddress(token.address) }));
}

async function heldTokens(
  account: string,
  ticker: string,
  out: Pick<CommandOutput, "withActivity">,
): Promise<TokenCandidate[]> {
  try {
    const tokens = await out.withActivity(
      `Reading the tokens account "${account}" holds…`,
      "Tokens read",
      () => findAccountTokens(account),
    );
    return tokens.filter(token => sameTicker(token.ticker, ticker));
  } catch (error) {
    throw new Error(
      `Couldn't read the tokens account "${account}" holds (${errorMessage(error)}). Pass the ` +
        `${ticker} token's address with --token.`,
      { cause: error },
    );
  }
}

export async function resolveTokenByTicker(
  network: IntentNetwork,
  ticker: string,
  account: string | undefined,
  out: Pick<CommandOutput, "withActivity">,
): Promise<string> {
  const kind = TOKEN_KIND[network];
  if (account) {
    const held = checksummed(network, await heldTokens(account, ticker, out));
    if (held.length > 1) {
      throw new Error(
        `Account "${account}" holds several ${kind}s with the ticker ${ticker}:` +
          `${listCandidates(held)}\nPass the one to send with --token.`,
      );
    }
    if (held.length === 1) {
      writeStderr(`${ticker} is ${held[0].address} (${held[0].name}), held by "${account}".\n`);
      return held[0].address;
    }
  }

  const listed = checksummed(network, await findTokensByTicker(network, ticker));
  if (listed.length === 0) {
    throw new Error(
      `No ${kind} on ${MAINNET[network]} has the ticker ${ticker} in the Crypto Assets List, ` +
        "which matches tickers case-sensitively (e.g. USDe, stETH). Check the ticker, or pass the " +
        "token's address with --token.",
    );
  }
  if (listed.length > 1) {
    throw new Error(
      `Several ${kind}s on ${MAINNET[network]} have the ticker ${ticker}:` +
        `${listCandidates(listed)}\nPass the one to send with --token.`,
    );
  }
  writeStderr(
    `${ticker} is ${listed[0].address} (${listed[0].name}), the only ${kind} with that ticker on ` +
      `${MAINNET[network]}.\n`,
  );
  return listed[0].address;
}
