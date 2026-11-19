import {
  findCryptoCurrencyById,
  getCryptoCurrencyById,
  listCryptoCurrencies,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";
import { warnIfTokensSkipped, type CommandOutput } from "../output";
import { errMessage } from "../shared/error-message";
import { writeStderr } from "../shared/ui";
import { toChecksumAddress } from "./evm";
import type { IntentNetwork } from "./send-intent";
import type { SenderAccount } from "./sender";
import {
  findAccountTokens,
  findSolanaMintProgram,
  findTokensByTicker,
  sameTicker,
  tokensWithTicker,
  type TokenCandidate,
} from "./token-lookup";

const TOKEN_KIND = { ethereum: "ERC-20 token", solana: "SPL token" } as const;
const MAINNET = { ethereum: "Ethereum mainnet", solana: "Solana mainnet" } as const;

export type TokenFlag = "token" | "from" | "to";
type SwapFlag = Exclude<TokenFlag, "token">;

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

function listCandidates(tokens: TokenCandidate[], flag: TokenFlag, complete: boolean): string {
  if (tokens.length === 0) return "";
  const more = complete ? "" : "\n  … and maybe more";
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
  const listed = await findTokensByTicker(network, ticker).catch(() => undefined);
  if (!listed) return "";
  return listCandidates(checksummed(network, listed.tokens), flag, listed.complete);
}

function isEther(value: string): boolean {
  const ether = getCryptoCurrencyById("ethereum");
  return [ether.id, ether.ticker, ether.name].some(label => sameTicker(label, value));
}

const TOKENS_OTHER_CHAINS_USE_AS_COIN = ["USDC"];

function coinNamed(value: string): CryptoCurrency | undefined {
  if (TOKENS_OTHER_CHAINS_USE_AS_COIN.some(ticker => sameTicker(ticker, value))) return undefined;
  return (
    findCryptoCurrencyById(value) ??
    listCryptoCurrencies().find(coin =>
      [coin.id, coin.ticker, coin.name].some(label => sameTicker(label, value)),
    )
  );
}

const TRANSFER = { from: "sell", to: "buy" } as const;

async function anotherChainsCoinError(
  value: string,
  coin: CryptoCurrency,
  flag: SwapFlag,
): Promise<Error> {
  const typedAsTickerOrName = [coin.ticker, coin.name].some(label => sameTicker(label, value));
  const ticker = typedAsTickerOrName ? value : coin.ticker;
  const tokens = await listTokensByTicker("ethereum", ticker, flag);
  const withTicker = typedAsTickerOrName ? "that ticker" : `the ticker ${ticker}`;
  return new Error(
    `--${flag} "${value}" is another chain's coin, not an asset on ${MAINNET.ethereum}. To ` +
      `${TRANSFER[flag]} an ${TOKEN_KIND.ethereum} with ${withTicker} instead, ` +
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
    const { tokens, skippedTokenIds } = await out.withActivity(
      `Reading the tokens account "${account.label}" holds…`,
      "Tokens read",
      () => findAccountTokens(account.descriptor),
    );
    warnIfTokensSkipped(skippedTokenIds);
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

async function tokenHeld(
  network: IntentNetwork,
  ticker: string,
  account: SenderAccount,
  out: Pick<CommandOutput, "withActivity">,
  flag: TokenFlag,
): Promise<TokenCandidate | undefined> {
  const held = checksummed(network, await heldTokens(network, account, ticker, out));
  if (held.length > 1) {
    throw new Error(
      `Account "${account.label}" holds several ${TOKEN_KIND[network]}s with the ticker ${ticker}:` +
        `${listCandidates(held, flag, true)}\n${ASK_FOR_TOKEN[flag].pickOne}`,
    );
  }
  const [only] = held;
  if (only) {
    writeStderr(`${only.ticker} is ${describeToken(only, flag)}, held by "${account.label}".\n`);
  }
  return only;
}

async function onlyListedToken(
  network: IntentNetwork,
  ticker: string,
  flag: TokenFlag,
): Promise<TokenCandidate> {
  const kind = TOKEN_KIND[network];
  const { tokens, complete } = await findTokensByTicker(network, ticker);
  const listed = checksummed(network, tokens);
  if (listed.length === 0) {
    throw new Error(
      `No ${kind} on ${MAINNET[network]} has the ticker ${ticker} in the Crypto Assets List. ` +
        `Check the ticker, or ${ASK_FOR_TOKEN[flag].passIt}.`,
    );
  }
  if (listed.length > 1) {
    throw new Error(
      `Several ${kind}s on ${MAINNET[network]} have the ticker ${ticker}:` +
        `${listCandidates(listed, flag, complete)}\n${ASK_FOR_TOKEN[flag].pickOne}`,
    );
  }
  const [only] = listed;
  const maybeOthers = complete
    ? ""
    : " The Crypto Assets List search for its other letter cases didn't finish, so another " +
      "token may have it too.";
  writeStderr(
    `${only.ticker} is ${describeToken(only, flag)}, the only ${kind} with that ticker on ` +
      `${MAINNET[network]}.${maybeOthers}\n`,
  );
  return only;
}

export async function resolveTokenByTicker(
  network: IntentNetwork,
  ticker: string,
  account: SenderAccount | undefined,
  out: Pick<CommandOutput, "withActivity">,
  flag: TokenFlag,
): Promise<TokenCandidate> {
  const held = account ? await tokenHeld(network, ticker, account, out, flag) : undefined;
  return held ?? onlyListedToken(network, ticker, flag);
}

export async function resolveSwapTicker(
  ticker: string,
  holder: SenderAccount | undefined,
  out: Pick<CommandOutput, "withActivity">,
  flag: SwapFlag,
): Promise<TokenCandidate | "native"> {
  if (isEther(ticker)) return "native";
  const held = holder ? await tokenHeld("ethereum", ticker, holder, out, flag) : undefined;
  if (held) return held;
  const coin = coinNamed(ticker);
  if (coin) throw await anotherChainsCoinError(ticker, coin, flag);
  return onlyListedToken("ethereum", ticker, flag);
}
