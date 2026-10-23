import { Addresses } from "./Addresses";
import { Currency } from "./Currency";
import { TokenType } from "./TokenType";

type AccountOptions = {
  currency: Currency;
  accountName: string;
  index: number;
  accountPath: string;
  tokenType?: TokenType;
  ensName?: string;
  derivationMode?: string;
  parentAccount?: Account;
  address?: string;
};

type TokenAccountOptions = AccountOptions & {
  tokenType: TokenType;
  parentAccount: Account;
};

export class Account {
  public readonly currency: Currency;
  public readonly accountName: string;
  public readonly index: number;
  public readonly accountPath: string;
  public readonly tokenType?: TokenType;
  public readonly ensName?: string;
  public readonly derivationMode?: string;
  public readonly parentAccount?: Account;
  public address?: string;

  constructor(options: AccountOptions) {
    this.currency = options.currency;
    this.accountName = options.accountName;
    this.index = options.index;
    this.accountPath = options.accountPath;
    this.tokenType = options.tokenType;
    this.ensName = options.ensName;
    this.derivationMode = options.derivationMode;
    this.parentAccount = options.parentAccount;
    this.address = options.address;
  }

  static readonly ADA_1 = new Account({
    currency: Currency.ADA,
    accountName: "Cardano 1",
    index: 0,
    accountPath: "1852'/1815'/0'/0/3",
  });
  static readonly ADA_2 = new Account({
    currency: Currency.ADA,
    accountName: "Cardano 2",
    index: 1,
    accountPath: "1852'/1815'/1'/0/2",
  });

  static readonly ALEO_1 = new Account({
    currency: Currency.ALEO,
    accountName: "Aleo 1",
    index: 0,
    accountPath: "44'/683'/0'/0'",
    derivationMode: "aleo",
  });
  static readonly ALEO_2 = new Account({
    currency: Currency.ALEO,
    accountName: "Aleo 2",
    index: 1,
    accountPath: "44'/683'/1'/0'",
    derivationMode: "aleo",
  });

  static readonly ALGO_1 = new Account({
    currency: Currency.ALGO,
    accountName: "Algorand 1",
    index: 0,
    accountPath: "44'/283'/0'/0/0",
  });
  static readonly ALGO_2 = new Account({
    currency: Currency.ALGO,
    accountName: "Algorand 2",
    index: 1,
    accountPath: "44'/283'/1'/0/0",
  });
  // Algorand account without ASA (tokens) for specific scenarios
  static readonly ALGO_3 = new Account({
    currency: Currency.ALGO,
    accountName: "Algorand 3",
    index: 2,
    accountPath: "44'/283'/2'/0/0",
  });

  static readonly APTOS_1 = new Account({
    currency: Currency.APT,
    accountName: "Aptos 1",
    index: 0,
    accountPath: "44'/637'/0'/0'/0'",
  });
  static readonly APTOS_2 = new Account({
    currency: Currency.APT,
    accountName: "Aptos 2",
    index: 1,
    accountPath: "44'/637'/1'/0'/0'",
  });

  static readonly ATOM_1 = new Account({
    currency: Currency.ATOM,
    accountName: "Cosmos 1",
    index: 0,
    accountPath: "44'/118'/0'/0/0",
  });
  static readonly ATOM_2 = new Account({
    currency: Currency.ATOM,
    accountName: "Cosmos 2",
    index: 1,
    accountPath: "44'/118'/1'/0/0",
  });

  static readonly BABY_1 = new Account({
    currency: Currency.BABY,
    accountName: "Babylon 1",
    index: 0,
    accountPath: "44'/118'/0'/0/0",
  });
  static readonly BABY_2 = new Account({
    currency: Currency.BABY,
    accountName: "Babylon 2",
    index: 1,
    accountPath: "44'/118'/1'/0/0",
  });

  static readonly BCH_1 = new Account({
    currency: Currency.BCH,
    accountName: "Bitcoin Cash 1",
    index: 0,
    accountPath: "44'/145'/0'/0/2",
    derivationMode: "cashaddr",
  });
  static readonly BCH_2 = new Account({
    currency: Currency.BCH,
    accountName: "Bitcoin Cash 2",
    index: 1,
    accountPath: "44'/145'/1'/0/2",
    derivationMode: "cashaddr",
  });

  static readonly BSC_1 = new Account({
    currency: Currency.BSC,
    accountName: "BNB Smart Chain 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  static readonly BSC_2 = new Account({
    currency: Currency.BSC,
    accountName: "BNB Smart Chain 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });

  static readonly BTC_LEGACY_1 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 1",
    index: 0,
    accountPath: "44'/0'/0'/0/1",
    derivationMode: "",
  });
  static readonly BTC_LEGACY_2 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 2",
    index: 1,
    accountPath: "44'/0'/1'/0/0",
    derivationMode: "",
  });

  static readonly BTC_NATIVE_SEGWIT_1 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 1",
    index: 0,
    accountPath: "84'/0'/0'/0/3",
    derivationMode: "native_segwit",
  });
  static readonly BTC_NATIVE_SEGWIT_2 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 2",
    index: 1,
    accountPath: "84'/0'/1'/0/1",
    derivationMode: "native_segwit",
  });

  static readonly BTC_SEGWIT_1 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 1",
    index: 0,
    accountPath: "49'/0'/0'/0/1",
    derivationMode: "segwit",
  });
  static readonly BTC_SEGWIT_2 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 2",
    index: 1,
    accountPath: "49'/0'/1'/0/0",
    derivationMode: "segwit",
  });

  static readonly BTC_TAPROOT_1 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 1",
    index: 0,
    accountPath: "86'/0'/0'/0/1",
    derivationMode: "taproot",
  });
  static readonly BTC_TAPROOT_2 = new Account({
    currency: Currency.BTC,
    accountName: "Bitcoin 2",
    index: 1,
    accountPath: "86'/0'/1'/0/0",
    derivationMode: "taproot",
  });

  static readonly CCD_TESTNET_1 = new Account({
    currency: Currency.CCD_TESTNET,
    accountName: "Concordium (Testnet) 1",
    index: 0,
    accountPath: "44'/1'/0'/0'/0'/0'",
  });
  static readonly CCD_TESTNET_2 = new Account({
    currency: Currency.CCD_TESTNET,
    accountName: "Concordium (Testnet) 2",
    index: 1,
    accountPath: "44'/1'/0'/0'/0'/1'",
  });

  static readonly CELO_1 = new Account({
    currency: Currency.CELO,
    accountName: "Celo 1",
    index: 0,
    accountPath: "44'/52752'/0'/0/0",
  });

  static readonly DOGE_1 = new Account({
    currency: Currency.DOGE,
    accountName: "Dogecoin 1",
    index: 0,
    accountPath: "44'/3'/0'/0/1",
  });
  static readonly DOGE_2 = new Account({
    currency: Currency.DOGE,
    accountName: "Dogecoin 2",
    index: 1,
    accountPath: "44'/3'/1'/0/1",
  });

  static readonly DOT_1 = new Account({
    currency: Currency.DOT,
    accountName: "Polkadot 1",
    index: 0,
    accountPath: "44'/354'/0'/0'/0'",
  });
  static readonly DOT_2 = new Account({
    currency: Currency.DOT,
    accountName: "Polkadot 2",
    index: 1,
    accountPath: "44'/354'/1'/0'/0'",
  });
  static readonly DOT_3 = new Account({
    currency: Currency.DOT,
    accountName: "Polkadot 3",
    index: 2,
    accountPath: "44'/354'/2'/0'/0'",
  });

  static readonly ETH_1 = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  // don't use this account as a recipient, it's balance
  // should stay close to null to allow for error message testing
  static readonly ETH_2 = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });
  static readonly ETH_2_WITH_ENS = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
    ensName: "speculos-qaa.eth",
  });
  static readonly ETH_2_LOWER_CASE = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });
  static readonly ETH_3 = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 3",
    index: 2,
    accountPath: "44'/60'/2'/0/0",
  });
  static readonly ETH_4 = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 4",
    index: 3,
    accountPath: "44'/60'/3'/0/0",
  });
  // Swaps that may approve a token with the CLI on every run, kept off Ethereum 1's broadcast flows
  static readonly ETH_5 = new Account({
    currency: Currency.ETH,
    accountName: "Ethereum 5",
    index: 4,
    accountPath: "44'/60'/4'/0/0",
  });
  static readonly SANCTIONED_ETH = new Account({
    currency: Currency.ETH,
    accountName: "Sanctioned Ethereum",
    index: 0,
    accountPath: "",
  });

  // Hedera accounts use pre-configured addresses because account IDs cannot be derived from path
  static readonly HEDERA_1 = new Account({
    currency: Currency.HBAR,
    accountName: "Hedera 1",
    index: 0,
    accountPath: "44/3030",
    address: "0.0.10837606",
  });
  static readonly HEDERA_2 = new Account({
    currency: Currency.HBAR,
    accountName: "Hedera 2",
    index: 1,
    accountPath: "44/3030",
    address: "0.0.10837630",
  });

  static readonly INJ_1 = new Account({
    currency: Currency.INJ,
    accountName: "Injective 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });

  static readonly KASPA_1 = new Account({
    currency: Currency.KAS,
    accountName: "KASPA 1",
    index: 0,
    accountPath: "44'/111111'/0'/0/2",
  });
  static readonly KASPA_2 = new Account({
    currency: Currency.KAS,
    accountName: "KASPA 2",
    index: 1,
    accountPath: "44'/111111'/1'/0/1",
  });

  static readonly LTC_1 = new Account({
    currency: Currency.LTC,
    accountName: "Litecoin 1",
    index: 0,
    accountPath: "84'/2'/0'/0/0",
  });

  static readonly MINA_1 = new Account({
    currency: Currency.MINA,
    accountName: "Mina 1",
    index: 0,
    accountPath: "44'/12586'/0'/0/0",
  });
  static readonly MINA_2 = new Account({
    currency: Currency.MINA,
    accountName: "Mina 2",
    index: 1,
    accountPath: "44'/12586'/1'/0/0",
  });
  static readonly MINA_3 = new Account({
    currency: Currency.MINA,
    accountName: "Mina 3",
    index: 2,
    accountPath: "44'/12586'/2'/0/0",
  });
  static readonly MINA_4 = new Account({
    currency: Currency.MINA,
    accountName: "Mina 4",
    index: 3,
    accountPath: "44'/12586'/3'/0/0",
  });
  static readonly MINA_5 = new Account({
    currency: Currency.MINA,
    accountName: "Mina 5",
    index: 4,
    accountPath: "44'/12586'/4'/0/0",
  });

  static readonly MULTIVERS_X_1 = new Account({
    currency: Currency.MULTIVERS_X,
    accountName: "MultiversX 1",
    index: 0,
    accountPath: "44'/508'/0'/0/0",
  });
  static readonly MULTIVERS_X_2 = new Account({
    currency: Currency.MULTIVERS_X,
    accountName: "MultiversX 2",
    index: 1,
    accountPath: "44'/508'/1'/0/0",
  });

  static readonly NEAR_1 = new Account({
    currency: Currency.NEAR,
    accountName: "NEAR 1",
    index: 0,
    accountPath: "44'/397'/0'/0'/0'",
  });
  static readonly NEAR_2 = new Account({
    currency: Currency.NEAR,
    accountName: "NEAR 2",
    index: 1,
    accountPath: "44'/397'/0'/0'/1'",
  });

  static readonly OSMO_1 = new Account({
    currency: Currency.OSMO,
    accountName: "Osmosis 1",
    index: 0,
    accountPath: "44'/118'/0'/0/0",
  });
  static readonly OSMO_2 = new Account({
    currency: Currency.OSMO,
    accountName: "Osmosis 2",
    index: 1,
    accountPath: "44'/118'/1'/0/0",
  });

  static readonly POL_1 = new Account({
    currency: Currency.POL,
    accountName: "Polygon 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  static readonly POL_2 = new Account({
    currency: Currency.POL,
    accountName: "Polygon 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });

  static readonly SOL_1 = new Account({
    currency: Currency.SOL,
    accountName: "Solana 1",
    index: 0,
    accountPath: "44'/501'/0'",
  });
  static readonly SOL_2 = new Account({
    currency: Currency.SOL,
    accountName: "Solana 2",
    index: 1,
    accountPath: "44'/501'/1'",
  });
  static readonly SOL_3 = new Account({
    currency: Currency.SOL,
    accountName: "Solana 3",
    index: 2,
    accountPath: "44'/501'/2'",
  });
  static readonly SOL_4 = new Account({
    currency: Currency.SOL,
    accountName: "Solana 4",
    index: 3,
    accountPath: "44'/501'/3'",
  });

  static readonly TRX_1 = new Account({
    currency: Currency.TRX,
    accountName: "Tron 1",
    index: 0,
    accountPath: "44'/195'/0'/0/0",
  });
  static readonly TRX_2 = new Account({
    currency: Currency.TRX,
    accountName: "Tron 2",
    index: 1,
    accountPath: "44'/195'/1'/0/0",
  });
  static readonly TRX_3 = new Account({
    currency: Currency.TRX,
    accountName: "Tron 3",
    index: 2,
    accountPath: "44'/195'/2'/0/0",
  });

  static readonly XLM_1 = new Account({
    currency: Currency.XLM,
    accountName: "Stellar 1",
    index: 0,
    accountPath: "44'/148'/0'",
  });
  static readonly XLM_2 = new Account({
    currency: Currency.XLM,
    accountName: "Stellar 2",
    index: 1,
    accountPath: "44'/148'/1'",
  });
  static readonly XLM_3 = new Account({
    currency: Currency.XLM,
    accountName: "Stellar 3",
    index: 2,
    accountPath: "44'/148'/2'",
  });

  static readonly XRP_1 = new Account({
    currency: Currency.XRP,
    accountName: "XRP 1",
    index: 0,
    accountPath: "44'/144'/0'/0/0",
  });
  static readonly XRP_2 = new Account({
    currency: Currency.XRP,
    accountName: "XRP 2",
    index: 1,
    accountPath: "44'/144'/1'/0/0",
  });
  static readonly XRP_3 = new Account({
    currency: Currency.XRP,
    accountName: "XRP 3",
    index: 2,
    accountPath: "44'/144'/2'/0/0",
  });

  static readonly XTZ_1 = new Account({
    currency: Currency.XTZ,
    accountName: "Tezos 1",
    index: 0,
    accountPath: "44'/1729'/0'/0'",
  });
  static readonly XTZ_2 = new Account({
    currency: Currency.XTZ,
    accountName: "Tezos 2",
    index: 1,
    accountPath: "44'/1729'/1'/0'",
  });
  static readonly XTZ_3 = new Account({
    currency: Currency.XTZ,
    accountName: "Tezos 3",
    index: 2,
    accountPath: "44'/1729'/2'/0'",
  });
  static readonly XTZ_4 = new Account({
    currency: Currency.XTZ,
    accountName: "Tezos 4",
    index: 3,
    accountPath: "44'/1729'/3'/0'",
  });

  static readonly sep_ETH_1 = new Account({
    currency: Currency.sepETH,
    accountName: "Ethereum Sepolia 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  static readonly sep_ETH_2 = new Account({
    currency: Currency.sepETH,
    accountName: "Ethereum Sepolia 2",
    index: 1,
    accountPath: "44'/60'/0'/1/0",
  });

  static readonly SUI_1 = new Account({
    currency: Currency.SUI,
    accountName: "Sui 1",
    index: 0,
    accountPath: "44'/784'/0'/0'/0'",
  });
  static readonly SUI_2 = new Account({
    currency: Currency.SUI,
    accountName: "Sui 2",
    index: 1,
    accountPath: "44'/784'/1'/0'/0'",
  });

  static readonly BASE_1 = new Account({
    currency: Currency.BASE,
    accountName: "Base 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  static readonly BASE_2 = new Account({
    currency: Currency.BASE,
    accountName: "Base 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });

  static readonly OP_1 = new Account({
    currency: Currency.OP,
    accountName: "OP Mainnet 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });

  static readonly VET_1 = new Account({
    currency: Currency.VET,
    accountName: "Vechain 1",
    index: 0,
    accountPath: "44'/818'/0'/0/0",
  });
  static readonly VET_2 = new Account({
    currency: Currency.VET,
    accountName: "Vechain 2",
    index: 1,
    accountPath: "44'/818'/0'/0/1",
  });

  static readonly ZEC_1 = new Account({
    currency: Currency.ZEC,
    accountName: "Zcash 1",
    index: 0,
    accountPath: "44'/133'/0'/0/6",
  });
  static readonly ZEC_2 = new Account({
    currency: Currency.ZEC,
    accountName: "Zcash 2",
    index: 1,
    accountPath: "44'/133'/1'/0/3",
  });

  static readonly ICP_1 = new Account({
    currency: Currency.ICP,
    accountName: "Internet Computer 1",
    index: 0,
    accountPath: "44'/223'/0'/0/0",
  });
  static readonly ICP_2 = new Account({
    currency: Currency.ICP,
    accountName: "Internet Computer 2",
    index: 1,
    accountPath: "44'/223'/1'/0/0",
  });

  static readonly SEI_EVM_1 = new Account({
    currency: Currency.SEI_EVM,
    accountName: "SEI Network (EVM) 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
  });
  static readonly SEI_EVM_2 = new Account({
    currency: Currency.SEI_EVM,
    accountName: "SEI Network (EVM) 2",
    index: 1,
    accountPath: "44'/60'/1'/0/0",
  });

  static readonly EMPTY = new Account({
    currency: Currency.BTC,
    accountName: "Empty",
    index: 0,
    accountPath: "",
  });
}

export class TokenAccount extends Account {
  constructor(options: TokenAccountOptions) {
    super(options);
  }

  static readonly ETH_LIDO = new TokenAccount({
    currency: Currency.ETH_LIDO,
    accountName: "LIDO Staked ETH 1",
    index: 0,
    accountPath: Account.ETH_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_1,
  });

  static readonly ETH_USDC_1 = new TokenAccount({
    currency: Currency.ETH_USDC,
    accountName: "USD Coin 1",
    index: 0,
    accountPath: Account.ETH_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_1,
  });

  // Never funded with USDC; used to test the zero-balance disabled state of Max/% buttons (B2CQA-5582)
  static readonly ETH_USDC_2 = new TokenAccount({
    currency: Currency.ETH_USDC,
    accountName: "USD Coin 2",
    index: 1,
    accountPath: Account.ETH_2.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_2,
  });

  static readonly ETH_USDT_1 = new TokenAccount({
    currency: Currency.ETH_USDT,
    accountName: "(Ethereum) Tether USD 1",
    index: 0,
    accountPath: Account.ETH_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_1,
  });

  static readonly ETH_USDT_2 = new TokenAccount({
    currency: Currency.ETH_USDT,
    accountName: "(Ethereum) Tether USD 2",
    index: 1,
    accountPath: Account.ETH_2.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_2,
  });

  static readonly ETH_USDT_3 = new TokenAccount({
    currency: Currency.ETH_USDT,
    accountName: "Tether USD 3",
    index: 2,
    accountPath: Account.ETH_3.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_3,
  });

  static readonly ETH_WGNK_1 = new TokenAccount({
    currency: Currency.ETH_WGNK,
    accountName: "(Ethereum) Wrapped Gonka 1",
    index: 0,
    accountPath: Account.ETH_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_1,
  });

  static readonly ETH_WGNK_3 = new TokenAccount({
    currency: Currency.ETH_WGNK,
    accountName: "Wrapped Gonka 3",
    index: 2,
    accountPath: Account.ETH_3.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_3,
  });

  static readonly ETH_WBTC_4 = new TokenAccount({
    currency: Currency.ETH_WBTC,
    accountName: "(Ethereum) Wrapped Bitcoin 4",
    index: 3,
    accountPath: Account.ETH_4.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_4,
  });

  static readonly ETH_USDT_4 = new TokenAccount({
    currency: Currency.ETH_USDT,
    accountName: "(Ethereum) Tether USD 4",
    index: 3,
    accountPath: Account.ETH_4.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_4,
  });

  static readonly ETH_USDC_5 = new TokenAccount({
    currency: Currency.ETH_USDC,
    accountName: "USD Coin 5",
    index: 4,
    accountPath: Account.ETH_5.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_5,
  });

  static readonly ETH_USDT_5 = new TokenAccount({
    currency: Currency.ETH_USDT,
    accountName: "(Ethereum) Tether USD 5",
    index: 4,
    accountPath: Account.ETH_5.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ETH_5,
  });

  static readonly SOL_GIGA_1 = new TokenAccount({
    currency: Currency.SOL_GIGA,
    accountName: "(Solana) GIGACHAD 1",
    index: 0,
    accountPath: Account.SOL_1.accountPath,
    tokenType: TokenType.SPL,
    parentAccount: Account.SOL_1,
    address: Addresses.SOL_GIGA_1_ATA_ADDRESS,
  });
  static readonly SOL_GIGA_2 = new TokenAccount({
    currency: Currency.SOL_GIGA,
    accountName: "(Solana) GIGACHAD 2",
    index: 1,
    accountPath: Account.SOL_2.accountPath,
    tokenType: TokenType.SPL,
    parentAccount: Account.SOL_2,
    address: Addresses.SOL_GIGA_2_ATA_ADDRESS,
  });
  static readonly SOL_GIGA_3 = new TokenAccount({
    currency: Currency.SOL_GIGA,
    accountName: "GIGACHAD 3",
    index: 2,
    accountPath: Account.SOL_3.accountPath,
    tokenType: TokenType.SPL,
    parentAccount: Account.SOL_3,
  });

  static readonly SOL_WIF_1 = new TokenAccount({
    currency: Currency.SOL_WIF,
    accountName: "dogwifhat 1",
    index: 0,
    accountPath: Account.SOL_1.accountPath,
    tokenType: TokenType.SPL,
    parentAccount: Account.SOL_1,
  });
  static readonly SOL_WIF_2 = new TokenAccount({
    currency: Currency.SOL_WIF,
    accountName: "dogwifhat 2",
    index: 1,
    accountPath: Account.SOL_2.accountPath,
    tokenType: TokenType.SPL,
    parentAccount: Account.SOL_2,
  });

  static readonly TRX_BTT = new TokenAccount({
    currency: Currency.TRX_BTT,
    accountName: "BitTorrent",
    index: 0,
    accountPath: Account.TRX_1.accountPath,
    tokenType: TokenType.TRC20,
    parentAccount: Account.TRX_1,
  });

  static readonly SUI_USDC_1 = new TokenAccount({
    currency: Currency.SUI_USDC,
    accountName: "SUI USDC 1",
    index: 0,
    accountPath: Account.SUI_1.accountPath,
    tokenType: TokenType.COIN,
    parentAccount: Account.SUI_1,
  });

  static readonly SUI_USDC_2 = new TokenAccount({
    currency: Currency.SUI_USDC,
    accountName: "SUI USDC 2",
    index: 1,
    accountPath: Account.SUI_2.accountPath,
    tokenType: TokenType.COIN,
    parentAccount: Account.SUI_2,
  });

  static readonly BSC_BUSD_1 = new TokenAccount({
    currency: Currency.BSC_BUSD,
    accountName: "Binance-Peg BUSD Token 1",
    index: 0,
    accountPath: Account.BSC_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.BSC_1,
  });

  static readonly BSC_BUSD_2 = new TokenAccount({
    currency: Currency.BSC_BUSD,
    accountName: "Binance-Peg BUSD Token 2",
    index: 1,
    accountPath: Account.BSC_2.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.BSC_2,
  });
  static readonly ALGO_USDT_1 = new TokenAccount({
    currency: Currency.ALGO_USDT,
    accountName: "(Algorand) Tether USDt 1",
    index: 0,
    accountPath: Account.ALGO_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ALGO_1,
  });
  static readonly ALGO_USDT_2 = new TokenAccount({
    currency: Currency.ALGO_USDT,
    accountName: "(Algorand) Tether USDt 2",
    index: 1,
    accountPath: Account.ALGO_2.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.ALGO_2,
  });

  static readonly XLM_USDC = new TokenAccount({
    currency: Currency.XLM_USDC,
    accountName: "(Stellar) USDC 1",
    index: 0,
    accountPath: Account.XLM_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.XLM_1,
  });

  static readonly XLM_USDC_3 = new TokenAccount({
    currency: Currency.XLM_USDC,
    accountName: "(Stellar) USDC 3",
    index: 2,
    accountPath: Account.XLM_3.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.XLM_3,
  });

  static readonly POL_DAI_1 = new TokenAccount({
    currency: Currency.POL_DAI,
    accountName: "Dai 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
    tokenType: TokenType.ERC20,
    parentAccount: Account.POL_1,
  });
  static readonly POL_UNI = new TokenAccount({
    currency: Currency.POL_UNI,
    accountName: "Uniswap 1",
    index: 0,
    accountPath: "44'/60'/0'/0/0",
    tokenType: TokenType.ERC20,
    parentAccount: Account.POL_1,
  });
  static readonly TRX_USDT = new TokenAccount({
    currency: Currency.TRX_USDT,
    accountName: "(Tron) USDT 1",
    index: 0,
    accountPath: "44'/195'/0'/0/0",
    tokenType: TokenType.TRC20,
    parentAccount: Account.TRX_1,
  });
  static readonly TRX_USDT_2 = new TokenAccount({
    currency: Currency.TRX_USDT,
    accountName: "(Tron) USDT 2",
    index: 1,
    accountPath: "44'/195'/1'/0/0",
    tokenType: TokenType.TRC20,
    parentAccount: Account.TRX_2,
  });
  static readonly BASE_AERODROME_1 = new TokenAccount({
    currency: Currency.BASE_AERODROME,
    accountName: "(Base) Aerodrome 1",
    index: 0,
    accountPath: Account.BASE_1.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.BASE_1,
  });
  static readonly BASE_AERODROME_2 = new TokenAccount({
    currency: Currency.BASE_AERODROME,
    accountName: "(Base) Aerodrome 2",
    index: 1,
    accountPath: Account.BASE_2.accountPath,
    tokenType: TokenType.ERC20,
    parentAccount: Account.BASE_2,
  });
}

export type AccountType = Account | TokenAccount;

export const getParentAccountName = (account: AccountType): string => {
  if ("parentAccount" in account && Boolean(account.tokenType)) {
    return (account as TokenAccount).parentAccount!.accountName;
  }
  return account.accountName;
};
