/**
 * Backtest tokens against CAL or DaDa API
 *
 * This command validates that all tokens bundled in Ledger Live are available
 * in the backend APIs and match the expected format after client-side transformations.
 *
 * Known Issues:
 * - LIVE-22562: Some TRON tokens (trc20/1001426, trc10/1001421) missing from APIs
 */
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import * as legacy from "@ledgerhq/cryptoassets/legacy/legacy-data";
import * as utils from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import { legacyIdToApiId, convertApiToken, convertApiAssets } from "@ledgerhq/cryptoassets";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

const CAL_API_URL = "https://crypto-assets-service.api.ledger.com/v1";
const DADA_API_URL = "https://dada.api.ledger.com/v1";

const TOKEN_OUTPUT_FIELDS = [
  "id",
  "name",
  "ticker",
  "symbol",
  "contract_address",
  "standard",
  "decimals",
  "network",
  "network_family",
  "units",
  "type",
  "delisted",
  "chain_id",
  "token_identifier",
  "network_type",
  "meta_currency_id",
  "blockchain_name",
  "live_signature",
] as const;

const tokenTypes = {
  "ethereum mainnet": legacy.mainnetTokens.map(utils.convertERC20),
  "ethereum sepolia": legacy.sepoliaTokens.map(utils.convertERC20),
  polygon: legacy.polygonTokens.map(utils.convertERC20),
  hedera: legacy.hederaTokens.map(utils.convertHederaTokens),
  bsc: legacy.bnbTokens.map(utils.convertERC20),
  "tron trc10": legacy.trc10tokens.map(utils.convertTRONTokens("trc10")),
  "tron trc20": legacy.trc20tokens.map(utils.convertTRONTokens("trc20")),
  algorand: legacy.asatokens.map(utils.convertAlgorandASATokens),
  multiversx: legacy.esdttokens.map(utils.convertMultiversXESDTTokens),
  cardano: legacy.cardanoNativeTokens.map(utils.convertCardanoNativeTokens),
  stellar: legacy.stellarTokens.map(utils.convertStellarTokens),
  vechain: legacy.vechainTokens.map(utils.convertVechainToken),
  ton: legacy.jettonTokens.map(utils.convertJettonToken),
  filecoin: legacy.filecoinTokens.map(utils.convertERC20),
  solana: legacy.spltokens.map(utils.convertSplTokens),
  sonic: legacy.sonicTokens.map(utils.convertERC20),
  core: legacy.coreTokens.map(utils.convertERC20),
  celo: legacy.celoTokens.map(utils.convertERC20),
  sui: legacy.suitokens.map(utils.convertSuiTokens),
  "aptos coin": legacy.aptCoinTokens.map(utils.convertAptCoinTokens),
  "aptos fa": legacy.aptFATokens.map(utils.convertAptFaTokens),
};

function heuristicTokenToPick(tokens: (TokenCurrency | undefined)[]) {
  return tokens[Math.floor((tokens.length - 1) / 2)];
}

async function testCalApi(legacyToken: TokenCurrency): Promise<string> {
  const apiId = legacyIdToApiId(legacyToken.id);
  const params = new URLSearchParams({
    id: apiId,
    limit: "1",
    output: TOKEN_OUTPUT_FIELDS.join(","),
  });

  const response = await fetch(`${CAL_API_URL}/tokens?${params.toString()}`);
  if (!response.ok) {
    return `❌ ${legacyToken.id}: API request failed (${response.status})`;
  }

  const data = (await response.json()) as unknown[];
  if (!data || data.length === 0) {
    return `❌ ${legacyToken.id}: Token not found in CAL API`;
  }

  const rawToken = data[0] as {
    id: string;
    contract_address: string;
    name: string;
    ticker: string;
    units: Array<{ code: string; name: string; magnitude: number }>;
    standard: string;
    token_identifier?: string;
    delisted?: boolean;
    live_signature?: string;
  };
  const calToken = convertApiToken({
    id: rawToken.id,
    contractAddress: rawToken.contract_address,
    name: rawToken.name,
    ticker: rawToken.ticker,
    units: rawToken.units,
    standard: rawToken.standard,
    tokenIdentifier: rawToken.token_identifier,
    delisted: rawToken.delisted,
    ledgerSignature: rawToken.live_signature,
  });

  if (!calToken) {
    return `❌ ${legacyToken.id}: Failed to convert API token`;
  }

  if (calToken.id !== legacyToken.id) {
    return `❌ ${legacyToken.id}: ID mismatch (got ${calToken.id})`;
  }

  if (calToken.contractAddress !== legacyToken.contractAddress) {
    return `❌ ${legacyToken.id}: Contract address mismatch`;
  }

  if (calToken.tokenType !== legacyToken.tokenType) {
    return `❌ ${legacyToken.id}: Token type mismatch (${calToken.tokenType} vs ${legacyToken.tokenType})`;
  }

  return `✅ ${legacyToken.id}`;
}

async function testDadaApi(legacyToken: TokenCurrency): Promise<string> {
  const apiId = legacyIdToApiId(legacyToken.id);
  const params = new URLSearchParams({
    product: "lld",
    minVersion: "2.131.0",
    pageSize: "100",
    currencyIds: apiId,
  });

  const response = await fetch(`${DADA_API_URL}/assets?${params.toString()}`);
  if (!response.ok) {
    return `❌ ${legacyToken.id}: API request failed (${response.status})`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as any;
  const rawCryptoOrTokenCurrencies = data.cryptoOrTokenCurrencies || {};
  const cryptoOrTokenCurrencies = convertApiAssets(rawCryptoOrTokenCurrencies);
  const dadaToken = cryptoOrTokenCurrencies[apiId] as TokenCurrency | undefined;

  if (!dadaToken) {
    return `❌ ${legacyToken.id}: Token not found in DaDa API`;
  }

  if (dadaToken.id !== legacyToken.id) {
    return `❌ ${legacyToken.id}: ID mismatch (got ${dadaToken.id})`;
  }

  if (dadaToken.contractAddress !== legacyToken.contractAddress) {
    return `❌ ${legacyToken.id}: Contract address mismatch`;
  }

  if (dadaToken.tokenType !== legacyToken.tokenType) {
    return `❌ ${legacyToken.id}: Token type mismatch (${dadaToken.tokenType} vs ${legacyToken.tokenType})`;
  }

  return `✅ ${legacyToken.id}`;
}

export type BacktestTokensOpts = {
  api: string;
};

export default {
  description: "Backtest tokens against CAL or DaDa API",
  args: [
    {
      name: "api",
      alias: "a",
      type: String,
      desc: "API to test against (cal or dada)",
      default: "cal",
    },
  ],
  job: (opts: BacktestTokensOpts) => {
    const testFn = opts.api === "dada" ? testDadaApi : testCalApi;
    const apiName = opts.api === "dada" ? "DaDa" : "CAL";

    return from(Object.entries(tokenTypes)).pipe(
      concatMap(async ([name, tokens]) => {
        const legacyToken = heuristicTokenToPick(tokens);
        if (!legacyToken) {
          return `⚠️  ${name}: No token to test`;
        }

        const result = await testFn(legacyToken);
        return `[${apiName}] ${name}: ${result}`;
      }),
    );
  },
};
