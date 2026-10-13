import { writeStderr } from "../shared/ui";
import type { IntentNetwork } from "./send-intent";
import { findAccountTokens, findTokensByTicker, type TokenCandidate } from "./token-lookup";

const TOKEN_KIND = { ethereum: "ERC-20 token", solana: "SPL token" } as const;
const MAINNET = { ethereum: "Ethereum mainnet", solana: "Solana mainnet" } as const;

function sameTicker(token: TokenCandidate, ticker: string): boolean {
  return token.ticker.toUpperCase() === ticker.toUpperCase();
}

function listCandidates(tokens: TokenCandidate[]): string {
  return tokens.map(token => `\n  ${token.address} (${token.name})`).join("");
}

/**
 * The contract or mint of the token `ticker` names on `network`, never a guess: the one token
 * account of `account` with that ticker, else the one listed CAL token with it. Anything else
 * fails with the candidates, so that `--token` picks one.
 */
export async function resolveTokenByTicker(
  network: IntentNetwork,
  ticker: string,
  account: string | undefined,
): Promise<string> {
  const kind = TOKEN_KIND[network];
  if (account) {
    const held = (await findAccountTokens(account)).filter(token => sameTicker(token, ticker));
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

  const listed = await findTokensByTicker(network, ticker);
  if (listed.length === 0) {
    throw new Error(
      `No ${kind} on ${MAINNET[network]} has the ticker ${ticker} in the Crypto Assets List. ` +
        "Check the ticker, or pass the token's address with --token.",
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
