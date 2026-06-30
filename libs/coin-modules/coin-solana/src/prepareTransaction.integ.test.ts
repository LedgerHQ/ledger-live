import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { NotEnoughGas } from "@ledgerhq/errors";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import getTransactionStatus from "./getTransactionStatus";
import { encodeAccountIdWithTokenAccountAddress } from "./logic";
import { getChainAPI } from "./network";
import { prepareTransaction } from "./prepareTransaction";
import type {
  SolanaAccount,
  SolanaTokenAccount,
  TokenTransferTransaction,
  Transaction,
} from "./types";

const SOLANA_RPC_ENDPOINT = "https://solana.coin.ledger.com";

const VIBECODOOR_MINT = "Aj1mSpD4vJDN5r3xptnHsjHQgGWDLge8bRQi2W6pump";
const SENDER_ADDRESS = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";

const MAIN_ACCOUNT_RENT_EXEMPT = new BigNumber(890_880);
const SPENDABLE_AT_BUG_THRESHOLD = new BigNumber(2_044_280);
const BALANCE_AT_BUG_THRESHOLD = SPENDABLE_AT_BUG_THRESHOLD.plus(MAIN_ACCOUNT_RENT_EXEMPT);

const VIBECODOOR_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: "solana/spl/the_vibecodoor_aj1mspd4vjdn5r3xptnhsjhqggwdlge8brqi2w6pump",
  contractAddress: VIBECODOOR_MINT,
  parentCurrencyId: "solana",
  tokenType: "spl",
  name: "The Vibecodoor",
  ticker: "Vibecodoor",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Vibecodoor", code: "Vibecodoor", magnitude: 6 }],
};

setupMockCryptoAssetsStore({
  findTokenByAddressInCurrency: async (address: string) =>
    address.toLowerCase() === VIBECODOOR_MINT.toLowerCase() ? VIBECODOOR_TOKEN : undefined,
  findTokenById: async (id: string) => (id === VIBECODOOR_TOKEN.id ? VIBECODOOR_TOKEN : undefined),
  getTokensSyncHash: async () => "0",
});

const mainAccountId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "solana",
  xpubOrAddress: SENDER_ADDRESS,
  derivationMode: "solanaMain",
});

const senderAtaAddress = PublicKey.findProgramAddressSync(
  [
    new PublicKey(SENDER_ADDRESS).toBuffer(),
    TOKEN_2022_PROGRAM_ID.toBuffer(),
    new PublicKey(VIBECODOOR_MINT).toBuffer(),
  ],
  ASSOCIATED_TOKEN_PROGRAM_ID,
)[0].toBase58();

const subAccountId = encodeAccountIdWithTokenAccountAddress(mainAccountId, senderAtaAddress);

function buildSenderAccount(): SolanaAccount {
  const tokenSub = {
    type: "TokenAccount",
    id: subAccountId,
    parentId: mainAccountId,
    token: VIBECODOOR_TOKEN,
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
    operations: [],
    pendingOperations: [],
    state: "initialized",
    creationDate: new Date(),
    operationsCount: 0,
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
    swapHistory: [],
  } as unknown as SolanaTokenAccount;

  return {
    type: "Account",
    id: mainAccountId,
    seedIdentifier: SENDER_ADDRESS,
    xpub: SENDER_ADDRESS,
    used: true,
    derivationMode: "solanaMain",
    currency: getCryptoCurrencyById("solana"),
    index: 0,
    nfts: [],
    freshAddress: SENDER_ADDRESS,
    freshAddressPath: "44'/501'/0'/0'",
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: BALANCE_AT_BUG_THRESHOLD,
    spendableBalance: SPENDABLE_AT_BUG_THRESHOLD,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    subAccounts: [tokenSub],
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
    solanaResources: { stakes: [], unstakeReserve: new BigNumber(0) },
  } as SolanaAccount;
}

describe("prepareTransaction packs NotEnoughGas", () => {
  jest.setTimeout(30_000);

  const api = getChainAPI({ endpoint: SOLANA_RPC_ENDPOINT });

  it("prepareTransaction packs NotEnoughGas when spendable == classic ATA rent + fee", async () => {
    const account = buildSenderAccount();
    const freshRecipient = Keypair.generate().publicKey.toBase58();

    const tx: Transaction = {
      family: "solana",
      amount: new BigNumber(1),
      recipient: freshRecipient,
      useAllAmount: false,
      model: {
        kind: "token.transfer",
        uiState: { subAccountId },
      } as TokenTransferTransaction,
    };

    const prepared = await prepareTransaction(account, tx, api);
    const status = await getTransactionStatus(account, prepared);

    expect(status.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
    const fees = (status.errors.gasPrice as Error & { fees?: string }).fees;
    expect(parseFloat(fees ?? "0")).toBeGreaterThan(0.001);
  });
});
