import { Currency } from "./Currency";
import { AccountType } from "tests/enum/AccountType";

export class Account {
  constructor(
    public readonly currency: Currency,
    public readonly accountName: string,
    public readonly address: string,
    public readonly accountType?: AccountType,
    public readonly index?: number,
  ) {}

  static readonly BTC_NATIVE_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1qm6tw2c0u842qjs7g2n2c7ulh76f6xn4sk0dsyt",
    undefined,
    0,
  );

  static readonly BTC_NATIVE_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
    undefined,
    1,
  );

  static readonly BTC_LEGACY_1 = new Account(
    Currency.BTC,
    "Bitcoin Legacy 1",
    "1FMx2XwRHKXhbJcaekgPqN111wtRftkHyw",
    undefined,
    0,
  );

  static readonly BTC_LEGACY_2 = new Account(
    Currency.BTC,
    "Bitcoin Legacy 2",
    "1Nen8hLiZysV6TWi6o6hTBp6dtkRXrJyWh",
    undefined,
    1,
  );

  static readonly BTC_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin Segwit 1",
    "3C7fQ47BiZuZN7V2WTgHLq4sqpb5BEp91i",
    undefined,
    0,
  );

  static readonly BTC_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin Segwit 2",
    "3B5psxZfUkU6AzPJoirgPQS7dC9vv7ohcK",
    undefined,
    1,
  );

  static readonly BTC_TAPROOT_1 = new Account(
    Currency.BTC,
    "Bitcoin Taproot 1",
    "bc1pv4aytu7u4pk4nvelymxp65vndxqh4e3xsn0v7cguy6t98k5vynks5td23j",
    undefined,
    0,
  );

  static readonly BTC_TAPROOT_2 = new Account(
    Currency.BTC,
    "Bitcoin Taproot 2",
    "bc1pywrw64mkvpzxkje5fkcz7vafj03yyzyvx4vg8wy2klvq8wtyfe7sq2jgzd",
    undefined,
    1,
  );

  static readonly tBTC_1 = new Account(
    Currency.tBTC,
    "Bitcoin Testnet 1",
    "tb1qxmwe6n93fls8r69837cmyt6ua406xaen9hy24d",
    undefined,
    0,
  );

  static readonly tBTC_2 = new Account(
    Currency.tBTC,
    "Bitcoin Testnet 2",
    "tb1qyjr6hsx3wvsdq998zvn5cusqkdyfvvnpnsz6a5",
    undefined,
    1,
  );

  static readonly DOGE_1 = new Account(
    Currency.DOGE,
    "Dogecoin 1",
    "DTWxYBoP319u1KBUFE9Z6FQxMKJRT1U7tQ",
    undefined,
    0,
  );

  static readonly DOGE_2 = new Account(
    Currency.DOGE,
    "Dogecoin 2",
    "DKbRbGP5spDCaRSGLjWGWZGbhE19nQ1LoK",
    undefined,
    1,
  );

  static readonly ETH_1 = new Account(
    Currency.ETH,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly ETH_2 = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    undefined,
    1,
  );

  static readonly ETH_3 = new Account(
    Currency.ETH,
    "Ethereum 3",
    "0x50F293e4C3815F5214dac1Bae8F8FC3F24b8BA59",
    undefined,
    2,
  );

  static readonly tETH_1 = new Account(
    Currency.tETH,
    "Ethereum Holesky 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly tETH_2 = new Account(
    Currency.tETH,
    "Ethereum Holesky 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    undefined,
    1,
  );

  static readonly sep_ETH_1 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly sep_ETH_2 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    undefined,
    1,
  );

  static readonly DOT_1 = new Account(
    Currency.DOT,
    "Polkadot 1",
    "15NKsw4AoSEgBJ5NpHDkAjUmqLRfeSuqZBzZXH9uRg6MWbo3",
    undefined,
    0,
  );

  static readonly DOT_2 = new Account(
    Currency.DOT,
    "Polkadot 2",
    "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
    undefined,
    1,
  );

  static readonly DOT_3 = new Account(
    Currency.DOT,
    "Polkadot 3",
    "1532VyvZyyMUmLfhMUYh2KRVLzwYfHcxjtejyX4swkpG82BX",
    undefined,
    2,
  );

  static readonly SOL_1 = new Account(
    Currency.SOL,
    "Solana 1",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    undefined,
    0,
  );

  static readonly SOL_2 = new Account(
    Currency.SOL,
    "Solana 2",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
    undefined,
    1,
  );

  static readonly TRX_1 = new Account(
    Currency.TRX,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    undefined,
    0,
  );

  static readonly TRX_2 = new Account(
    Currency.TRX,
    "Tron 2",
    "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
    undefined,
    1,
  );

  static readonly TRX_3 = new Account(
    Currency.TRX,
    "Tron 3",
    "TWBAMUMc69Z82zJtXh1TqdPyWv7PNyud6p",
    undefined,
    2,
  );

  static readonly XRP_1 = new Account(
    Currency.XRP,
    "XRP 1",
    "rhQvt8XfAGn1hVVtMUmdGKBUdnKzi2oimV",
    undefined,
    0,
  );

  static readonly XRP_2 = new Account(
    Currency.XRP,
    "XRP 2",
    "r36cgyrfC1xSQMvjuiSeFJEcBTq31imZS",
    undefined,
    1,
  );

  static readonly XRP_3 = new Account(
    Currency.XRP,
    "XRP 3",
    "rn2Z2yShWcvdTSQVo1EqjUpD1sjwBkZALb",
    undefined,
    2,
  );

  static readonly ADA_1 = new Account(
    Currency.ADA,
    "Cardano 1",
    "addr1q9q9q55zyew785z6c2lnrhnzghy038r6mepmqn6v28kupk5ug4c7v5lwwfjwgn4mnpzgmhrhp8xry804kuvfh6ru2ews8d5td8",
    undefined,
    0,
  );
  static readonly ADA_2 = new Account(
    Currency.ADA,
    "Cardano 2",
    "addr1qyjd47qfktpza4ycjddjadaarzwdumwrqws0xage8gvsmrq5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qwzv6ac",
    undefined,
    1,
  );

  static readonly ALGO_1 = new Account(
    Currency.ALGO,
    "Algorand 1",
    "HQ6YJWSVG3KVRE56V6UGWMUJLDVNPQUNXJBY7VJ56VMNMGIKVDTC7JEKOU",
    undefined,
    0,
  );

  static readonly ALGO_2 = new Account(
    Currency.ALGO,
    "Algorand 2",
    "6TFDU3BYQ2FO32SOYQDTHDW5XKGEYH4FCT34ZQRHFPJRVMLEQWOO2OEUU4",
    undefined,
    1,
  );

  static readonly ALGO_3 = new Account(
    Currency.ALGO,
    "Algorand 3",
    "3ASRTAN6KCZCICTIFQ5N2UBOSSBOZ7WFSOI2CJEJ4ESK532RODQZ7KCSOA",
    undefined,
    2,
  );

  static readonly XLM_1 = new Account(
    Currency.XLM,
    "Stellar 1",
    "GCAGRZ7XABYSXV7CPFSFWQIUK6XFXECBPWP2SGMVOB2KFWN7YM4TDGSX",
    undefined,
    0,
  );

  static readonly XLM_2 = new Account(
    Currency.XLM,
    "Stellar 2",
    "GCTGRCFN7AT6NW4DZVI4QN55BRNQA64TXEZSMYPE7BNUZMLMVISXT652",
    undefined,
    1,
  );

  static readonly BCH_1 = new Account(
    Currency.BCH,
    "Bitcoin Cash 1",
    "qz82kem69vdafku8xf4zpt9p5ytj8umwpujj7wjcv6",
    undefined,
    0,
  );

  static readonly BCH_2 = new Account(
    Currency.BCH,
    "Bitcoin Cash 2",
    "qp2ka732e6h82djvr5ge4vtru0cl3g8lxqtyfmzzl9",
    undefined,
    1,
  );

  static readonly ATOM_1 = new Account(
    Currency.ATOM,
    "Cosmos 1",
    "cosmos18sdl4lvyjtvpjkkt5smglux9sf4phdcpaddfae",
    undefined,
    0,
  );

  static readonly ATOM_2 = new Account(
    Currency.ATOM,
    "Cosmos 2",
    "cosmos12d854g9mut943gu5ncyhalapukttkddnvlxaq6",
    undefined,
    1,
  );

  static readonly XTZ_1 = new Account(
    Currency.XTZ,
    "Tezos 1",
    "tz1UD2zz5eFTW2Jy26kBnC3ZkdeazUgeFWST",
    undefined,
    0,
  );

  static readonly XTZ_2 = new Account(
    Currency.XTZ,
    "Tezos 2",
    "tz1g3uEPZ9T3AhUZDTbGW9V43JRfizJmSnPv",
    undefined,
    1,
  );

  static readonly POL_1 = new Account(
    Currency.POL,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly POL_2 = new Account(
    Currency.POL,
    "Polygon 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    undefined,
    1,
  );

  static readonly BSC_1 = new Account(
    Currency.BSC,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly NEAR_1 = new Account(
    Currency.NEAR,
    "NEAR 1",
    "70b2982a31cfcffc773145d2143392612bb83a22926c912e2ce3ec0634f637e2",
    undefined,
    0,
  );

  static readonly NEAR_2 = new Account(
    Currency.NEAR,
    "NEAR 2",
    "5effd8bfea3885b6f5f91256663e5af720b18761a96bd6592e210a23f950872c",
    undefined,
    1,
  );

  static readonly ETH_USDT_1 = new Account(
    Currency.ETH_USDT,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    AccountType.ERC20,
    0,
  );

  static readonly ETH_USDT_2 = new Account(
    Currency.ETH_USDT,
    "Ethereum 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    AccountType.ERC20,
    1,
  );

  static readonly ETH_LIDO = new Account(
    Currency.ETH_LIDO,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    AccountType.ERC20,
    0,
  );

  static readonly XLM_USCD = new Account(
    Currency.XLM_USCD,
    "Stellar 1",
    "GCAGRZ7XABYSXV7CPFSFWQIUK6XFXECBPWP2SGMVOB2KFWN7YM4TDGSX",
    undefined,
    0,
  );

  static readonly ALGO_USDT_1 = new Account(
    Currency.ALGO_USDT,
    "Algorand 1",
    "HQ6YJWSVG3KVRE56V6UGWMUJLDVNPQUNXJBY7VJ56VMNMGIKVDTC7JEKOU",
    undefined,
    0,
  );

  static readonly ALGO_USDT_2 = new Account(
    Currency.ALGO_USDT,
    "Algorand 2",
    "6TFDU3BYQ2FO32SOYQDTHDW5XKGEYH4FCT34ZQRHFPJRVMLEQWOO2OEUU4",
    undefined,
    1,
  );

  static readonly ALGO_USDT_3 = new Account(
    Currency.ALGO_USDT,
    "Algorand 3",
    "3ASRTAN6KCZCICTIFQ5N2UBOSSBOZ7WFSOI2CJEJ4ESK532RODQZ7KCSOA",
    undefined,
    2,
  );

  static readonly TRX_USDT = new Account(
    Currency.TRX_USDT,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    undefined,
    0,
  );

  static readonly TRX_BTT = new Account(
    Currency.TRX_BTT,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    AccountType.TRC20,
    0,
  );

  static readonly BSC_BUSD_1 = new Account(
    Currency.BSC_BUSD,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly BSC_BUSD_2 = new Account(
    Currency.BSC_BUSD,
    "Binance Smart Chain 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    undefined,
    1,
  );

  static readonly BSC_SHIBA = new Account(
    Currency.BSC_SHIBA,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly POL_DAI_1 = new Account(
    Currency.POL_DAI,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly POL_UNI = new Account(
    Currency.POL_UNI,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    undefined,
    0,
  );

  static readonly EMPTY = new Account(Currency.BTC, "Empty", " ");

  static readonly ETH_2_LOWER_CASE = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0x43047a5023d55a8658fcb1c1cea468311adaa3ad",
    undefined,
    1,
  );

  static readonly MULTIVERS_X_1 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 1",
    "erd1kp2psapk98pjtxr0n583qlq9zurwdwaqcvgh7l5hyj6hh839p5dq82cuw9",
    undefined,
    0,
  );

  static readonly OSMO_1 = new Account(
    Currency.OSMO,
    "Osmosis 1",
    "osmo1w7v2v6v8z3r3d8x8h7yjv6w2k3c5w3z7w6v8v8",
    undefined,
    0,
  );
}
