import { Addresses } from "./Addresses";
import { Currency } from "./Currency";
import { TokenType } from "./TokenType";

export class Account {
  constructor(
    public readonly currency: Currency,
    public readonly accountName: string,
    public readonly index: number,
    public readonly accountPath: string,
    public readonly tokenType?: TokenType,
    public readonly ensName?: string,
    public readonly derivationMode?: string,
    public readonly parentAccount?: Account,
    public address?: string,
  ) {}

  static readonly ADA_1 = new Account(Currency.ADA, "Cardano 1", 0, "1852'/1815'/0'/0/3");
  static readonly ADA_2 = new Account(Currency.ADA, "Cardano 2", 1, "1852'/1815'/1'/0/2");

  static readonly ALGO_1 = new Account(Currency.ALGO, "Algorand 1", 0, "44'/283'/0'/0/0");
  static readonly ALGO_2 = new Account(Currency.ALGO, "Algorand 2", 1, "44'/283'/1'/0/0");

  static readonly APTOS_1 = new Account(Currency.APT, "Aptos 1", 0, "44'/637'/0'/0'/0'");
  static readonly APTOS_2 = new Account(Currency.APT, "Aptos 2", 1, "44'/637'/1'/0'/0'");

  static readonly ATOM_1 = new Account(Currency.ATOM, "Cosmos 1", 0, "44'/118'/0'/0/0");
  static readonly ATOM_2 = new Account(Currency.ATOM, "Cosmos 2", 1, "44'/118'/1'/0/0");

  static readonly BCH_1 = new Account(
    Currency.BCH,
    "Bitcoin Cash 1",
    0,
    "44'/145'/0'/0/2",
    undefined,
    undefined,
    "cashaddr",
  );
  static readonly BCH_2 = new Account(
    Currency.BCH,
    "Bitcoin Cash 2",
    1,
    "44'/145'/1'/0/2",
    undefined,
    undefined,
    "cashaddr",
  );

  static readonly BSC_1 = new Account(Currency.BSC, "BNB Chain 1", 0, "44'/60'/0'/0/0");
  static readonly BSC_2 = new Account(Currency.BSC, "BNB Chain 2", 1, "44'/60'/1'/0/0");

  static readonly BTC_LEGACY_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    0,
    "44'/0'/0'/0/1",
    undefined,
    undefined,
    "",
  );
  static readonly BTC_LEGACY_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    1,
    "44'/0'/1'/0/0",
    undefined,
    "",
  );

  static readonly BTC_NATIVE_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    0,
    "84'/0'/0'/0/3",
    undefined,
    undefined,
    "native_segwit",
  );
  static readonly BTC_NATIVE_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    1,
    "84'/0'/1'/0/1",
    undefined,
    undefined,
    "native_segwit",
  );

  static readonly BTC_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    0,
    "49'/0'/0'/0/1",
    undefined,
    undefined,
    "segwit",
  );
  static readonly BTC_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    1,
    "49'/0'/1'/0/0",
    undefined,
    undefined,
    "segwit",
  );

  static readonly BTC_TAPROOT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    0,
    "86'/0'/0'/0/1",
    undefined,
    undefined,
    "taproot",
  );
  static readonly BTC_TAPROOT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    1,
    "86'/0'/1'/0/0",
    undefined,
    undefined,
    "taproot",
  );

  static readonly CELO_1 = new Account(Currency.CELO, "Celo 1", 0, "44'/52752'/0'/0/0");

  static readonly DOGE_1 = new Account(Currency.DOGE, "Dogecoin 1", 0, "44'/3'/0'/0/1");
  static readonly DOGE_2 = new Account(Currency.DOGE, "Dogecoin 2", 1, "44'/3'/1'/0/1");

  static readonly DOT_1 = new Account(Currency.DOT, "Polkadot 1", 0, "44'/354'/0'/0'/0'");
  static readonly DOT_2 = new Account(Currency.DOT, "Polkadot 2", 1, "44'/354'/1'/0'/0'");
  static readonly DOT_3 = new Account(Currency.DOT, "Polkadot 3", 2, "44'/354'/2'/0'/0'");

  static readonly ETH_1 = new Account(
    Currency.ETH,
    "Ethereum 1",
    0,
    "44'/60'/0'/0/0",
    undefined,
    undefined,
    undefined,
  );
  // don't use this account as a recipient, it's balance
  // should stay close to null to allow for error message testing
  static readonly ETH_2 = new Account(Currency.ETH, "Ethereum 2", 1, "44'/60'/1'/0/0", undefined);
  static readonly ETH_2_WITH_ENS = new Account(
    Currency.ETH,
    "Ethereum 2",
    1,
    "44'/60'/1'/0/0",
    undefined,
    "speculos.eth",
  );
  static readonly ETH_2_LOWER_CASE = new Account(Currency.ETH, "Ethereum 2", 1, "44'/60'/1'/0/0");
  static readonly ETH_3 = new Account(Currency.ETH, "Ethereum 3", 3, "44'/60'/2'/0/0");
  static readonly SANCTIONED_ETH = new Account(Currency.ETH, "Sanctioned Ethereum", 0, "");

  static readonly HEDERA_1 = new Account(Currency.HBAR, "Hedera 1", 0, "44/3030");

  static readonly INJ_1 = new Account(Currency.INJ, "Injective 1", 0, "44'/60'/0'/0/0");

  static readonly KASPA_1 = new Account(Currency.KAS, "KASPA 1", 0, "44'/111111'/0'/0/2");
  static readonly KASPA_2 = new Account(Currency.KAS, "KASPA 2", 1, "44'/111111'/1'/0/1");

  static readonly LTC_1 = new Account(Currency.LTC, "Litecoin 1", 0, "84'/2'/0'/0/0");

  static readonly MULTIVERS_X_1 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 1",
    0,
    "44'/508'/0'/0/0",
  );
  static readonly MULTIVERS_X_2 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 2",
    1,
    "44'/508'/1'/0/0",
  );

  static readonly NEAR_1 = new Account(Currency.NEAR, "NEAR 1", 0, "44'/397'/0'/0'/0'");
  static readonly NEAR_2 = new Account(Currency.NEAR, "NEAR 2", 1, "44'/397'/0'/0'/1'");

  static readonly OSMO_1 = new Account(Currency.OSMO, "Osmosis 1", 0, "44'/118'/0'/0/0");
  static readonly OSMO_2 = new Account(Currency.OSMO, "Osmosis 2", 1, "44'/118'/1'/0/0");

  static readonly POL_1 = new Account(
    Currency.POL,
    "Polygon 1",
    0,
    "44'/60'/0'/0/0",
    undefined,
    undefined,
    undefined,
  );
  static readonly POL_2 = new Account(Currency.POL, "Polygon 2", 1, "44'/60'/1'/0/0");

  static readonly SOL_1 = new Account(Currency.SOL, "Solana 1", 0, "44'/501'/0'");
  static readonly SOL_2 = new Account(Currency.SOL, "Solana 2", 1, "44'/501'/1'");
  static readonly SOL_3 = new Account(Currency.SOL, "Solana 3", 2, "44'/501'/2'");
  static readonly SOL_4 = new Account(Currency.SOL, "Solana 4", 3, "44'/501'/3'");

  static readonly TRX_1 = new Account(Currency.TRX, "Tron 1", 0, "44'/195'/0'/0/0");
  static readonly TRX_2 = new Account(Currency.TRX, "Tron 2", 1, "44'/195'/1'/0/0");
  static readonly TRX_3 = new Account(Currency.TRX, "Tron 3", 2, "44'/195'/2'/0/0");

  static readonly XLM_1 = new Account(Currency.XLM, "Stellar 1", 0, "44'/148'/0'");
  static readonly XLM_2 = new Account(Currency.XLM, "Stellar 2", 1, "44'/148'/1'");

  static readonly XRP_1 = new Account(Currency.XRP, "XRP 1", 0, "44'/144'/0'/0/0");
  static readonly XRP_2 = new Account(Currency.XRP, "XRP 2", 1, "44'/144'/1'/0/0");
  static readonly XRP_3 = new Account(Currency.XRP, "XRP 3", 2, "44'/144'/2'/0/0");

  static readonly XTZ_1 = new Account(Currency.XTZ, "Tezos 1", 0, "44'/1729'/0'/0'");
  static readonly XTZ_2 = new Account(Currency.XTZ, "Tezos 2", 1, "44'/1729'/1'/0'");

  static readonly sep_ETH_1 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 1",
    0,
    "44'/60'/0'/0/0",
  );
  static readonly sep_ETH_2 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 2",
    1,
    "44'/60'/0'/1/0",
  );

  static readonly SUI_1 = new Account(Currency.SUI, "Sui 1", 0, "44'/784'/0'/0'/0'");
  static readonly SUI_2 = new Account(Currency.SUI, "Sui 2", 1, "44'/784'/1'/0'/0'");

  static readonly BASE_1 = new Account(Currency.BASE, "Base 1", 0, "44'/60'/0'/0/0");
  static readonly BASE_2 = new Account(Currency.BASE, "Base 2", 1, "44'/60'/1'/0/0");

  static readonly VET_1 = new Account(Currency.VET, "Vechain 1", 0, "44'/818'/0'/0/0");
  static readonly VET_2 = new Account(Currency.VET, "Vechain 2", 1, "44'/818'/0'/0/1");

  static readonly ZEC_1 = new Account(Currency.ZEC, "Zcash 1", 0, "44'/133'/0'/0/0");
  static readonly ZEC_2 = new Account(Currency.ZEC, "Zcash 2", 0, "44'/133'/1'/0/0");

  static readonly EMPTY = new Account(Currency.BTC, "Empty", 0, "");
}

export class TokenAccount extends Account {
  constructor(
    currency: Currency,
    accountName: string,
    index: number,
    path: string,
    tokenType: TokenType,
    parentAccount: Account,
    ensName?: string,
    derivationMode?: string,
    address?: string,
  ) {
    super(
      currency,
      accountName,
      index,
      path,
      tokenType,
      ensName,
      derivationMode,
      parentAccount,
      address,
    );
  }

  static readonly ETH_LIDO = new TokenAccount(
    Currency.ETH_LIDO,
    "LIDO Staked ETH 1",
    0,
    Account.ETH_1.accountPath,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDC_1 = new TokenAccount(
    Currency.ETH_USDC,
    "USD Coin 1",
    0,
    Account.ETH_1.accountPath,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDT_1 = new TokenAccount(
    Currency.ETH_USDT,
    "Tether USD 1",
    0,
    Account.ETH_1.accountPath,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDT_2 = new TokenAccount(
    Currency.ETH_USDT,
    "Tether USD 2",
    1,
    Account.ETH_2.accountPath,
    TokenType.ERC20,
    Account.ETH_2,
  );

  static readonly SOL_GIGA_1 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 1",
    0,
    Account.SOL_1.accountPath,
    TokenType.SPL,
    Account.SOL_1,
    undefined,
    undefined,
    Addresses.SOL_GIGA_1_ATA_ADDRESS,
  );
  static readonly SOL_GIGA_2 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 2",
    1,
    Account.SOL_2.accountPath,
    TokenType.SPL,
    Account.SOL_2,
    undefined,
    undefined,
    Addresses.SOL_GIGA_2_ATA_ADDRESS,
  );
  static readonly SOL_GIGA_3 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 3",
    2,
    Account.SOL_3.accountPath,
    TokenType.SPL,
    Account.SOL_3,
  );

  static readonly SOL_WIF_1 = new TokenAccount(
    Currency.SOL_WIF,
    "dogwifhat 1",
    0,
    Account.SOL_1.accountPath,
    TokenType.SPL,
    Account.SOL_1,
  );
  static readonly SOL_WIF_2 = new TokenAccount(
    Currency.SOL_WIF,
    "dogwifhat 2",
    1,
    Account.SOL_2.accountPath,
    TokenType.SPL,
    Account.SOL_2,
  );

  static readonly TRX_BTT = new TokenAccount(
    Currency.TRX_BTT,
    "BitTorrent",
    0,
    Account.TRX_1.accountPath,
    TokenType.TRC20,
    Account.TRX_1,
  );

  static readonly SUI_USDC_1 = new TokenAccount(
    Currency.SUI_USDC,
    "SUI USDC 1",
    0,
    Account.SUI_1.accountPath,
    TokenType.ERC20,
    Account.SUI_1,
  );

  static readonly SUI_USDC_2 = new TokenAccount(
    Currency.SUI_USDC,
    "SUI USDC 2",
    1,
    Account.SUI_2.accountPath,
    TokenType.ERC20,
    Account.SUI_2,
  );

  static readonly BSC_BUSD_1 = new TokenAccount(
    Currency.BSC_BUSD,
    "Binance-Peg BUSD Token 1",
    0,
    Account.BSC_1.accountPath,
    TokenType.ERC20,
    Account.BSC_1,
  );

  static readonly BSC_BUSD_2 = new TokenAccount(
    Currency.BSC_BUSD,
    "Binance-Peg BUSD Token 2",
    1,
    Account.BSC_2.accountPath,
    TokenType.ERC20,
    Account.BSC_2,
  );
  static readonly ALGO_USDT_1 = new TokenAccount(
    Currency.ALGO_USDT,
    "Tether USDt 1",
    0,
    Account.ALGO_1.accountPath,
    TokenType.ERC20,
    Account.ALGO_1,
  );
  static readonly ALGO_USDT_2 = new TokenAccount(
    Currency.ALGO_USDT,
    "Tether USDt 2",
    1,
    Account.ALGO_2.accountPath,
    TokenType.ERC20,
    Account.ALGO_2,
  );

  static readonly XLM_USCD = new TokenAccount(
    Currency.XLM_USCD,
    "USDC 1",
    0,
    Account.XLM_1.accountPath,
    TokenType.ERC20,
    Account.XLM_1,
  );

  static readonly POL_DAI_1 = new TokenAccount(
    Currency.POL_DAI,
    "Dai 1",
    0,
    "44'/60'/0'/0/0",
    TokenType.ERC20,
    Account.POL_1,
  );
  static readonly POL_UNI = new TokenAccount(
    Currency.POL_UNI,
    "Uniswap 1",
    0,
    "44'/60'/0'/0/0",
    TokenType.ERC20,
    Account.POL_1,
  );
  static readonly TRX_USDT = new TokenAccount(
    Currency.TRX_USDT,
    "Tron 1",
    0,
    "44'/195'/0'/0/0",
    TokenType.TRC20,
    Account.TRX_1,
  );
}

export type AccountType = Account | TokenAccount;

export const getParentAccountName = (account: AccountType): string => {
  if ("parentAccount" in account && Boolean(account.tokenType)) {
    return (account as TokenAccount).parentAccount!.accountName;
  }
  return account.accountName;
};
