import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  listCryptoCurrencies,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";
import type { CommandOutput } from "../output";
import { errMessage } from "../shared/error-message";
import { writeStderr } from "../shared/ui";
import { toChecksumAddress } from "./evm";
import type { IntentNetwork } from "./send-intent";
import type { SenderAccount } from "./sender";
import {
  findAccountTokens,
  findSolanaMintProgram,
  findTokensByTicker,
  MAX_CANDIDATES,
  sameTicker,
  tokensWithTicker,
  type TokenCandidate,
} from "./token-lookup";

const TOKEN_KIND = { ethereum: "ERC-20 token", solana: "SPL token" } as const;
const MAINNET = { ethereum: "Ethereum mainnet", solana: "Solana mainnet" } as const;

export type TokenFlag = "token" | "from" | "to";

const ASK_FOR_TOKEN = {
  token: {
    pickOne: "Pass the one to send with --token.",
    passIt: "pass the token's address with --token",
  },
  from: {
    pickOne: "Pass the currency id of the one to sell with --from.",
    passIt: "pass the token's currency id with --from",
  },
  to: {
    pickOne: "Pass the currency id of the one to buy with --to.",
    passIt: "pass the token's currency id with --to",
  },
} as const;

function describeToken(token: TokenCandidate, flag: TokenFlag): string {
  return flag === "token"
    ? `${token.address} (${token.name})`
    : `${token.id} (${token.name}, ${token.address})`;
}

function listCandidates(tokens: TokenCandidate[], flag: TokenFlag): string {
  const more = tokens.length >= MAX_CANDIDATES ? "\n  … and maybe more" : "";
  return tokens.map(token => `\n  ${describeToken(token, flag)}`).join("") + more;
}

function checksummed(network: IntentNetwork, tokens: TokenCandidate[]): TokenCandidate[] {
  if (network !== "ethereum") return tokens;
  return tokens.map(token => ({ ...token, address: toChecksumAddress(token.address) }));
}

async function listTokensByTicker(
  network: IntentNetwork,
  ticker: string,
  flag: TokenFlag,
): Promise<string> {
  const listed = await findTokensByTicker(network, ticker).catch(() => []);
  return listCandidates(checksummed(network, listed), flag);
}

const TOKENS_OTHER_CHAINS_USE_AS_COIN: Record<IntentNetwork, readonly string[]> = {
  ethereum: ["USDC", "POL", "MNT"],
  solana: ["USDC", "HNT", "KIN", "NEON"],
};

export function coinNamed(network: IntentNetwork, value: string): CryptoCurrency | undefined {
  if (TOKENS_OTHER_CHAINS_USE_AS_COIN[network].some(ticker => sameTicker(ticker, value))) {
    return undefined;
  }
  const native = getCryptoCurrencyById(network);
  if (sameTicker(value, native.ticker)) return native;
  const named = (coin: CryptoCurrency) =>
    [coin.id, coin.ticker, coin.name].some(label => sameTicker(label, value));
  return (
    findCryptoCurrencyById(value) ??
    listCryptoCurrencies().find(named) ??
    listCryptoCurrencies(true).find(named)
  );
}

const TRANSFER = { token: "send", from: "sell", to: "buy" } as const;

export async function anotherChainsCoinError(
  network: IntentNetwork,
  value: string,
  coin: CryptoCurrency,
  flag: TokenFlag,
): Promise<Error> {
  const typedAsTickerOrName = [coin.ticker, coin.name].some(label => sameTicker(label, value));
  const ticker = typedAsTickerOrName ? value : coin.ticker;
  const tokens = await listTokensByTicker(network, ticker, flag);
  const withTicker = typedAsTickerOrName ? "that ticker" : `the ticker ${ticker}`;
  const named = flag === "token" ? `The --amount ticker ${value}` : `--${flag} "${value}"`;
  return new Error(
    `${named} is ${coin.name}, another chain's coin, not an asset on ${MAINNET[network]}. To ` +
      `${TRANSFER[flag]} an ${TOKEN_KIND[network]} with ${withTicker} instead, ` +
      `${ASK_FOR_TOKEN[flag].passIt}${tokens ? `:${tokens}` : "."}`,
  );
}

async function withoutToken2022(tokens: TokenCandidate[]): Promise<TokenCandidate[]> {
  const programs = await Promise.all(tokens.map(token => findSolanaMintProgram(token.address)));
  const sendable = tokens.filter((_, i) => programs[i] !== "spl-token-2022");
  return sendable.length > 0 ? sendable : tokens;
}

async function heldTokens(
  network: IntentNetwork,
  account: SenderAccount,
  ticker: string,
  out: Pick<CommandOutput, "withActivity">,
): Promise<TokenCandidate[]> {
  try {
    const tokens = await out.withActivity(
      `Reading the tokens account "${account.label}" holds…`,
      "Tokens read",
      () => findAccountTokens(account.descriptor),
    );
    const held = tokensWithTicker(tokens, ticker);
    return network === "solana" && held.length > 1 ? await withoutToken2022(held) : held;
  } catch (error) {
    writeStderr(
      `Couldn't read the tokens account "${account.label}" holds (${errMessage(error)}), so ` +
        `${ticker} is looked up in the Crypto Assets List instead.\n`,
    );
    return [];
  }
}

export async function resolveTokenByTicker(
  network: IntentNetwork,
  ticker: string,
  account: SenderAccount | undefined,
  out: Pick<CommandOutput, "withActivity">,
  flag: TokenFlag,
): Promise<TokenCandidate> {
  const kind = TOKEN_KIND[network];
  if (account) {
    const held = checksummed(network, await heldTokens(network, account, ticker, out));
    if (held.length > 1) {
      throw new Error(
        `Account "${account.label}" holds several ${kind}s with the ticker ${ticker}:` +
          `${listCandidates(held, flag)}\n${ASK_FOR_TOKEN[flag].pickOne}`,
      );
    }
    if (held.length === 1) {
      const [only] = held;
      writeStderr(`${only.ticker} is ${describeToken(only, flag)}, held by "${account.label}".\n`);
      return only;
    }
  }

  const listed = checksummed(network, await findTokensByTicker(network, ticker));
  if (listed.length === 0) {
    throw new Error(
      `No ${kind} on ${MAINNET[network]} has the ticker ${ticker} in the Crypto Assets List. ` +
        `Check the ticker, or ${ASK_FOR_TOKEN[flag].passIt}.`,
    );
  }
  if (listed.length > 1) {
    throw new Error(
      `Several ${kind}s on ${MAINNET[network]} have the ticker ${ticker}:` +
        `${listCandidates(listed, flag)}\n${ASK_FOR_TOKEN[flag].pickOne}`,
    );
  }
  const [only] = listed;
  writeStderr(
    `${only.ticker} is ${describeToken(only, flag)}, the only ${kind} with that ticker on ` +
      `${MAINNET[network]}.\n`,
  );
  return only;
}
