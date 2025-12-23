import { Currency } from "./Currency";
import { TokenType } from "./TokenType";

export class Account {
  constructor(
    public readonly currency: Currency,
    public readonly accountName: string,
    public readonly address: string,
    public readonly index: number,
    public readonly tokenType?: TokenType,
    public readonly ensName?: string,
    public readonly derivationMode?: string,
    public readonly parentAccount?: Account,
  ) {}

  static readonly ADA_1 = new Account(
    Currency.ADA,
    "Cardano 1",
    "addr1qxdnl4e047gmhhfgklkm7flsvjg7zs3z8kuzqsr85y6a3zsqucmu0k5rsc07x578az7h9ajg5djag7qtnhez3euuhqmqz2ntz7",
    0,
  );
  static readonly ADA_2 = new Account(
    Currency.ADA,
    "Cardano 2",
    "addr1qy23k66nq9550ra84f4glg3djyk2ap0ceuves36r7njresv5l3u8yaxv8p8fjyazgd3nqr6fnsuwv05cdaxjzwf5er4s89sns9",
    1,
  );

  static readonly ALGO_1 = new Account(
    Currency.ALGO,
    "Algorand 1",
    "FKB5Q57PE4RCZ2FC3QNLKXYWEYYYLNSHJDBIBCMGLJOMU22IGMEFVV2SWM",
    0,
  );
  static readonly ALGO_2 = new Account(
    Currency.ALGO,
    "Algorand 2",
    "ZOAMLQDG5BRPVQ4T32DDRRYO4XZAZIAIKDO62POUWA6PMXRW7QFRIWYF3I",
    1,
  );
  static readonly ALGO_USDT_1 = new Account(
    Currency.ALGO_USDT,
    "Algorand 1",
    "FKB5Q57PE4RCZ2FC3QNLKXYWEYYYLNSHJDBIBCMGLJOMU22IGMEFVV2SWM",
    0,
  );
  static readonly ALGO_USDT_2 = new Account(
    Currency.ALGO_USDT,
    "Algorand 2",
    "ZOAMLQDG5BRPVQ4T32DDRRYO4XZAZIAIKDO62POUWA6PMXRW7QFRIWYF3I",
    1,
  );

  static readonly APTOS_1 = new Account(
    Currency.APT,
    "Aptos 1",
    "0x612c5d5aecc5595bd1c84d709d1bafbfa9567d75462a626e5bcd75a33b0d102a",
    0,
  );
  static readonly APTOS_2 = new Account(
    Currency.APT,
    "Aptos 2",
    "0x5c116fcf3c1559365be3a1221fb205a88281fdb6c2fec69e6b14d49f7794ac30",
    1,
  );

  static readonly ATOM_1 = new Account(
    Currency.ATOM,
    "Cosmos 1",
    "cosmos1hylczrsa02p0gvqk4av86aqqxy32rr5s3xlhgn",
    0,
  );
  static readonly ATOM_2 = new Account(
    Currency.ATOM,
    "Cosmos 2",
    "cosmos1rjedvsnrjppjdrrwmwyep6zj2vle5praqdaj7c",
    1,
  );

  static readonly BCH_1 = new Account(
    Currency.BCH,
    "Bitcoin Cash 1",
    "qza3gqww8lr36a7x7hkejr22m759meaeygg3sek82u",
    0,
  );
  static readonly BCH_2 = new Account(
    Currency.BCH,
    "Bitcoin Cash 2",
    "qpxyk42pn3pg96229ajjvk2zxv3xva50sgc2nlvfvp",
    1,
  );

  static readonly BSC_1 = new Account(
    Currency.BSC,
    "BNB Chain 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );
  static readonly BSC_BUSD_1 = new Account(
    Currency.BSC_BUSD,
    "BNB Chain 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );
  static readonly BSC_BUSD_2 = new Account(
    Currency.BSC_BUSD,
    "BNB Chain 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
  );

  static readonly BTC_LEGACY_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "12HUxFoW2TJwcJWeD4PDKKk9qubAhQUe66",
    0,
    undefined,
    undefined,
    "",
  );
  static readonly BTC_LEGACY_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "19CbX6qTL3hfMKNdUnuU6o7PGxRWQ93RkK",
    1,
    undefined,
    undefined,
    "",
  );

  static readonly BTC_NATIVE_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1qextyk3yksxl5r4npdv83zwjnyav2upf04dccnj",
    0,
    undefined,
    undefined,
    "native_segwit",
  );
  static readonly BTC_NATIVE_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1qwwf2t8qr7ewnhlg50wrmqz7y4y5ydlge3rp7r4",
    1,
    undefined,
    undefined,
    "native_segwit",
  );

  static readonly BTC_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "36Do1VPXvGwU6b5MEQpzpGvhgSQhvogBSD",
    0,
    undefined,
    undefined,
    "segwit",
  );
  static readonly BTC_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "3HrXpmVwqz8Ka1dSxiecEKuovZuK2k35ig",
    1,
    undefined,
    undefined,
    "segwit",
  );

  static readonly BTC_TAPROOT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1pe388px6lhfh3lcqupx64s05l7hlvqx2tfwp3z2ykrrw8q66dprxqhcew4r",
    0,
    undefined,
    undefined,
    "taproot",
  );
  static readonly BTC_TAPROOT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1p32rssu2xyavq7rdk795dsx3vm989cjeu9zddxfktlvt34khc79rqt3v3ny",
    1,
    undefined,
    undefined,
    "taproot",
  );

  static readonly CELO_1 = new Account(
    Currency.CELO,
    "Celo 1",
    "0xD0871895dd6C620d245900Bbf010f652D1414e39",
    0,
  );

  static readonly DOGE_1 = new Account(
    Currency.DOGE,
    "Dogecoin 1",
    "D82p879ahWUAqrRv9UyLCsoZ2Ze8zMT8uy",
    0,
  );
  static readonly DOGE_2 = new Account(
    Currency.DOGE,
    "Dogecoin 2",
    "DHioUtasmdRWSdwUrV7BXjpGQDs84edoDM",
    1,
  );

  static readonly DOT_1 = new Account(
    Currency.DOT,
    "Polkadot 1",
    "15Yjixi2X8MkPxk3aoZRbR6iNgMUeLZhMQBA829T3W5LJU3Y",
    0,
  );
  static readonly DOT_2 = new Account(
    Currency.DOT,
    "Polkadot 2",
    "1JB2ZpkTXkp1KRZ68bLZsxvNoSaYW36pDcwf9xpT4zgaPg5",
    1,
  );
  static readonly DOT_3 = new Account(
    Currency.DOT,
    "Polkadot 3",
    "14Z1hD6qtHDhFKCqgJS6muCpbVtvQHBrS7hcjAE1ApYxqmUJ",
    2,
  );

  static readonly ETH_1 = new Account(
    Currency.ETH,
    "Ethereum 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
    undefined,
    undefined,
    undefined,
  );
  // don't use this account as a recipient, it's balance
  // should stay close to null to allow for error message testing
  static readonly ETH_2 = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
    undefined,
  );
  static readonly ETH_2_WITH_ENS = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
    undefined,
    "speculos.eth",
  );
  static readonly ETH_2_LOWER_CASE = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0xa1baa625c5e6a9304cb7acd86d2fee6b710ec3eb",
    1,
  );
  static readonly ETH_3 = new Account(
    Currency.ETH,
    "Ethereum 3",
    "0x5bB0dB1627e6ab18c6BDA6530Ea78d81AAc13B56",
    3,
  );
  static readonly SANCTIONED_ETH = new Account(
    Currency.ETH,
    "Sanctioned Ethereum",
    "0x04DBA1194ee10112fE6C3207C0687DEf0e78baCf",
    0,
  );

  static readonly HEDERA_1 = new Account(Currency.HBAR, "Hedera 1", "0.0.9374930", 0);

  static readonly INJ_1 = new Account(
    Currency.INJ,
    "Injective 1",
    "inj1f03w9wy8923f34k3ywujzx6nus0kz9txrfld28",
    0,
  );

  static readonly KASPA_1 = new Account(
    Currency.KAS,
    "KASPA 1",
    "kaspa:qpck869lulhmmkvnh40ety6ra2jhaq44wkfqaxnzmxp6gkgy0axh5zv726p3g",
    0,
  );

  static readonly KASPA_2 = new Account(
    Currency.KAS,
    "KASPA 2",
    "kaspa:qzyl5q3ektgp8j576ztwvqvq7pyrx8wscwft42ykchxrufwkhmp7ky2uf7ln0",
    1,
  );

  static readonly LTC_1 = new Account(
    Currency.LTC,
    "Litecoin 1",
    "ltc1q0lck8z8q3eaknz4gkys0uhjwfr26t439n8dtmy",
    0,
  );

  static readonly MULTIVERS_X_1 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 1",
    "erd12t2kcaf6txpdj3ga5us2c4d954f7tx32z4nk0yzngg32gxac9lkstgx76z",
    0,
  );
  static readonly MULTIVERS_X_2 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 2",
    "erd1athpxzvlfnu6r8x7lq60nem39ps0pv6gl0ymjl5x79d35xvmejaqq24k7g",
    1,
  );

  static readonly NEAR_1 = new Account(
    Currency.NEAR,
    "NEAR 1",
    "a9406880694fe86a4c92e09e1b7061761b0ac61e60c7986b67c75dceeffa0ce4",
    0,
  );
  static readonly NEAR_2 = new Account(
    Currency.NEAR,
    "NEAR 2",
    "6964d0caf478a4c3acd4e35d7e6a1f6a7b6837ab4c4dc87f9ab780b4cfe0897c",
    1,
  );

  static readonly OSMO_1 = new Account(
    Currency.OSMO,
    "Osmosis 1",
    "osmo1hylczrsa02p0gvqk4av86aqqxy32rr5seav87p",
    0,
  );
  static readonly OSMO_2 = new Account(
    Currency.OSMO,
    "Osmosis 2",
    "osmo1rjedvsnrjppjdrrwmwyep6zj2vle5pragkwzg2",
    1,
  );

  static readonly POL_1 = new Account(
    Currency.POL,
    "Polygon 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
    undefined,
    undefined,
    undefined,
  );
  static readonly POL_2 = new Account(
    Currency.POL,
    "Polygon 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
  );

  static readonly POL_DAI_1 = new Account(
    Currency.POL_DAI,
    "Polygon 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );

  static readonly POL_UNI = new Account(
    Currency.POL_UNI,
    "Polygon 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );

  static readonly SOL_1 = new Account(
    Currency.SOL,
    "Solana 1",
    "9MQyG8qo6i616yApRoRVMXYerGV4swwtd2bDETC3RCWB",
    0,
  );
  static readonly SOL_2 = new Account(
    Currency.SOL,
    "Solana 2",
    "8PirQq55nNZuVsTGK3i6RPAeuCdXgAUut3QRWhcF8ykb",
    1,
  );
  static readonly SOL_3 = new Account(
    Currency.SOL,
    "Solana 3",
    "JC2dR4QRMt68r2h7Sjs5wshx1RdmDVrSbdL2jWBuVf2t",
    2,
  );
  static readonly SOL_4 = new Account(
    Currency.SOL,
    "Solana 4",
    "FKFMRmTEJ6wHMWviuDocuhsZoTi3DnypoPQXBUjCCTXM",
    3,
  );

  static readonly tBTC_1 = new Account(
    Currency.tBTC,
    "Bitcoin 1",
    "tb1q635mdxwvgkt3msx3k24r9cxckuvyzruumv8qcx",
    0,
  );
  static readonly tBTC_2 = new Account(
    Currency.tBTC,
    "Bitcoin 2",
    "tb1qzweyhdt8jg7vl47p34vwwpgcqtuwwdewv3t5a3",
    1,
  );

  static readonly tETH_1 = new Account(
    Currency.tETH,
    "Ethereum Holesky 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );
  static readonly tETH_2 = new Account(
    Currency.tETH,
    "Ethereum Holesky 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
  );

  static readonly TRX_1 = new Account(
    Currency.TRX,
    "Tron 1",
    "TWVRVSRbt5UxeoL3Jb51bxCFPTYmRUVE8g",
    0,
  );
  static readonly TRX_2 = new Account(
    Currency.TRX,
    "Tron 2",
    "TAkZqkk6Ns4ErfTpeuMQkpbtPhD9GTPPH6",
    1,
  );
  static readonly TRX_3 = new Account(
    Currency.TRX,
    "Tron 3",
    "TVbT4GwxriGnSzyiPsCz7MwjPNQTMmP5xT",
    2,
  );

  static readonly TRX_USDT = new Account(
    Currency.TRX_USDT,
    "Tron 1",
    "TWVRVSRbt5UxeoL3Jb51bxCFPTYmRUVE8g",
    0,
  );

  static readonly XLM_1 = new Account(
    Currency.XLM,
    "Stellar 1",
    "GDHHTG3TIVJUCR6WHJEY7CWZPCD7I2CSQHCXC6S7MVH2EN626VDZKNEG",
    0,
  );
  static readonly XLM_2 = new Account(
    Currency.XLM,
    "Stellar 2",
    "GAPOJOLZKAFJBR7ADHLUOM4OHZMOVJ7DOEDUPC54ZT2VR4BSBRJAH37N",
    1,
  );

  static readonly XLM_USCD = new Account(
    Currency.XLM_USCD,
    "Stellar 1",
    "GDHHTG3TIVJUCR6WHJEY7CWZPCD7I2CSQHCXC6S7MVH2EN626VDZKNEG",
    0,
  );

  static readonly XRP_1 = new Account(
    Currency.XRP,
    "XRP 1",
    "rpaqckrNjvD5ffCQKje2biN79aQeAkAgrR",
    0,
  );
  static readonly XRP_2 = new Account(
    Currency.XRP,
    "XRP 2",
    "rBqFHJSxZLkxpEw7La1CiQsTwYTZja69s4",
    1,
  );
  static readonly XRP_3 = new Account(
    Currency.XRP,
    "XRP 3",
    "rHSwNdtyYfRcXZRykb4LWaNdRMAP3vNNdA",
    2,
  );

  static readonly XTZ_1 = new Account(
    Currency.XTZ,
    "Tezos 1",
    "tz1a54WyFgiNJd7ma3BHXwWzdforJpPAHf92",
    0,
  );
  static readonly XTZ_2 = new Account(
    Currency.XTZ,
    "Tezos 2",
    "tz1auNTNUwHL9YeeszmKnUen7cgzCJ6aPV32",
    1,
  );

  static readonly sep_ETH_1 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );
  static readonly sep_ETH_2 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
  );

  static readonly SUI_1 = new Account(
    Currency.SUI,
    "Sui 1",
    "0xc6169bcce8718609e43d179b087e6c1e2ac28e5325660af34d22fb5ce284031e",
    0,
  );
  static readonly SUI_2 = new Account(
    Currency.SUI,
    "Sui 2",
    "0x6644c1ce77c5e5ef8d8bd3ae2a4e18239e5d418a5e0800ed5037818399e3a7f6",
    1,
  );

  static readonly BASE_1 = new Account(
    Currency.BASE,
    "Base 1",
    "0x4BE2E2B8872AA298D6d123b9211B53E41f611566",
    0,
  );
  static readonly BASE_2 = new Account(
    Currency.BASE,
    "Base 2",
    "0xa1baa625c5E6A9304cB7AcD86d2fee6B710eC3eB",
    1,
  );

  static readonly EMPTY = new Account(Currency.BTC, "Empty", "", 0);
}

export class TokenAccount extends Account {
  constructor(
    currency: Currency,
    accountName: string,
    address: string,
    index: number,
    tokenType: TokenType,
    parentAccount: Account,
    ensName?: string,
    derivationMode?: string,
  ) {
    super(currency, accountName, address, index, tokenType, ensName, derivationMode, parentAccount);
  }

  static readonly ETH_LIDO = new TokenAccount(
    Currency.ETH_LIDO,
    "LIDO Staked ETH 1",
    Account.ETH_1.address,
    0,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDC_1 = new TokenAccount(
    Currency.ETH_USDC,
    "USD Coin 1",
    Account.ETH_1.address,
    0,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDT_1 = new TokenAccount(
    Currency.ETH_USDT,
    "Tether USD 1",
    Account.ETH_1.address,
    0,
    TokenType.ERC20,
    Account.ETH_1,
  );

  static readonly ETH_USDT_2 = new TokenAccount(
    Currency.ETH_USDT,
    "Tether USD 2",
    Account.ETH_2.address,
    1,
    TokenType.ERC20,
    Account.ETH_2,
  );

  static readonly SOL_GIGA_1 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 1",
    "J9wtyCcPRZ1ZuYQXudD7g3tajGz1Q5WkbVGCmb5qfjVp",
    0,
    TokenType.SPL,
    Account.SOL_1,
  );
  static readonly SOL_GIGA_2 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 2",
    "8nnwXo313DXWcE3kBR54gDKDmcySeGVjYRztbCAPzxev",
    1,
    TokenType.SPL,
    Account.SOL_2,
  );
  static readonly SOL_GIGA_3 = new TokenAccount(
    Currency.SOL_GIGA,
    "GIGACHAD 3",
    "8FHF6RzmFzRovEUKkzVvB7yh5DkFXt6jdGVfZrHKyVe7",
    2,
    TokenType.SPL,
    Account.SOL_3,
  );

  static readonly SOL_WIF_1 = new TokenAccount(
    Currency.SOL_WIF,
    "dogwifhat 1",
    "Ctj2Jm9T3igXbp6UDAiRvbso9Um1C4Gt6wHComZ3VC8z",
    0,
    TokenType.SPL,
    Account.SOL_1,
  );
  static readonly SOL_WIF_2 = new TokenAccount(
    Currency.SOL_WIF,
    "dogwifhat 2",
    "PXFuX7GdgVpPnuXwQSkjt3jihZZCjcxy8G5fsQa1NBn",
    1,
    TokenType.SPL,
    Account.SOL_2,
  );

  static readonly TRX_BTT = new TokenAccount(
    Currency.TRX_BTT,
    "BitTorrent",
    Account.TRX_1.address,
    0,
    TokenType.TRC20,
    Account.TRX_1,
  );

  static readonly SUI_USDC_1 = new TokenAccount(
    Currency.SUI_USDC,
    "SUI USDC 1",
    Account.SUI_1.address,
    0,
    TokenType.ERC20,
    Account.SUI_1,
  );

  static readonly SUI_USDC_2 = new TokenAccount(
    Currency.SUI_USDC,
    "SUI USDC 2",
    Account.SUI_2.address,
    1,
    TokenType.ERC20,
    Account.SUI_2,
  );
}

export type AccountType = Account | TokenAccount;

export const getParentAccountName = (account: AccountType): string => {
  if ("parentAccount" in account && Boolean(account.tokenType)) {
    return (account as TokenAccount).parentAccount!.accountName;
  }
  return account.accountName;
};

export const getAccountAddress = (account: AccountType): string => {
  if ("parentAccount" in account && Boolean(account.tokenType)) {
    return (account as TokenAccount).parentAccount!.address;
  }
  return account.address;
};
