import { Currency } from "./Currency";
import { TokenType } from "./TokenType";
import { Nft } from "./Nft";

export type AccountType = Account;

export class Account {
  constructor(
    public readonly currency: Currency,
    public readonly accountName: string,
    public readonly address: string,
    public readonly index?: number,
    public readonly tokenType?: TokenType,
    public readonly ensName?: string,
    public readonly derivationMode?: string,
    public readonly nft?: Nft[],
    public readonly ataAddress?: string,
  ) {}

  static readonly LTC_1 = new Account(
    Currency.LTC,
    "Litecoin 1",
    "ltc1qysx9g8cdypja73kc808jg7clcm5xud7tny9gp3",
    0,
    undefined,
  );

  static readonly INJ_1 = new Account(
    Currency.INJ,
    "Injective 1",
    "inj1hyz3lqavdc28jfph0wlwh5d2026r5elkmxxpwr",
    0,
    undefined,
  );

  static readonly APTOS_1 = new Account(
    Currency.APT,
    "Aptos 1",
    "0xb69a68cc64f7aa193705193f4dd598320a0a74baf7e4b50c9980c5bd60a82390",
    0,
    undefined,
  );

  static readonly APTOS_2 = new Account(
    Currency.APT,
    "Aptos 2",
    "0x98739115d8ba968aa0870a1ce6a988a0cb5aeb2e5f0cb5a0f346c7a1bb7e4a27",
    1,
    undefined,
  );

  static readonly BTC_NATIVE_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1qd0jevdq89hlcazal9cak8t850t6nn9fmn5flnj",
    0,
    undefined,
    undefined,
    "native_segwit",
  );

  static readonly BTC_NATIVE_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
    1,
    undefined,
    undefined,
    "native_segwit",
  );

  static readonly BTC_LEGACY_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "1FMx2XwRHKXhbJcaekgPqN111wtRftkHyw",
    0,
    undefined,
    undefined,
    "",
  );

  static readonly BTC_LEGACY_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "1Nen8hLiZysV6TWi6o6hTBp6dtkRXrJyWh",
    1,
    undefined,
    undefined,
    "",
  );

  static readonly BTC_SEGWIT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "3C7fQ47BiZuZN7V2WTgHLq4sqpb5BEp91i",
    0,
    undefined,
    undefined,
    "segwit",
  );

  static readonly BTC_SEGWIT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "3B5psxZfUkU6AzPJoirgPQS7dC9vv7ohcK",
    1,
    undefined,
    undefined,
    "segwit",
  );

  static readonly BTC_TAPROOT_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1pv4aytu7u4pk4nvelymxp65vndxqh4e3xsn0v7cguy6t98k5vynks5td23j",
    0,
    undefined,
    undefined,
    "taproot",
  );

  static readonly BTC_TAPROOT_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1pywrw64mkvpzxkje5fkcz7vafj03yyzyvx4vg8wy2klvq8wtyfe7sq2jgzd",
    1,
    undefined,
    undefined,
    "taproot",
  );

  static readonly tBTC_1 = new Account(
    Currency.tBTC,
    "Bitcoin 1",
    "tb1qxmwe6n93fls8r69837cmyt6ua406xaen9hy24d",
    0,
    undefined,
  );

  static readonly tBTC_2 = new Account(
    Currency.tBTC,
    "Bitcoin 2",
    "tb1qyjr6hsx3wvsdq998zvn5cusqkdyfvvnpnsz6a5",
    1,
    undefined,
  );

  static readonly DOGE_1 = new Account(
    Currency.DOGE,
    "Dogecoin 1",
    "DTWxYBoP319u1KBUFE9Z6FQxMKJRT1U7tQ",
    0,
    undefined,
  );

  static readonly DOGE_2 = new Account(
    Currency.DOGE,
    "Dogecoin 2",
    "DKbRbGP5spDCaRSGLjWGWZGbhE19nQ1LoK",
    1,
    undefined,
  );

  static readonly ETH_1 = new Account(
    Currency.ETH,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
    undefined,
    undefined,
    [Nft.ANTITUS, Nft.PODIUM, Nft.NY_LA_MUSE],
  );

  static readonly ETH_2 = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    undefined,
    "speculos.eth",
  );

  static readonly ETH_3 = new Account(
    Currency.ETH,
    "Ethereum 3",
    "0x50F293e4C3815F5214dac1Bae8F8FC3F24b8BA59",
    3,
    undefined,
  );

  static readonly tETH_1 = new Account(
    Currency.tETH,
    "Ethereum Holesky 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly tETH_2 = new Account(
    Currency.tETH,
    "Ethereum Holesky 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    undefined,
  );

  static readonly sep_ETH_1 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly sep_ETH_2 = new Account(
    Currency.sepETH,
    "Ethereum Sepolia 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    undefined,
  );

  static readonly DOT_1 = new Account(
    Currency.DOT,
    "Polkadot 1",
    "15NKsw4AoSEgBJ5NpHDkAjUmqLRfeSuqZBzZXH9uRg6MWbo3",
    0,
    undefined,
  );

  static readonly DOT_2 = new Account(
    Currency.DOT,
    "Polkadot 2",
    "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
    1,
    undefined,
  );

  static readonly DOT_3 = new Account(
    Currency.DOT,
    "Polkadot 3",
    "1532VyvZyyMUmLfhMUYh2KRVLzwYfHcxjtejyX4swkpG82BX",
    2,
    undefined,
  );

  static readonly SOL_1 = new Account(
    Currency.SOL,
    "Solana 1",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    0,
    undefined,
  );

  static readonly SOL_2 = new Account(
    Currency.SOL,
    "Solana 2",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
    1,
    undefined,
  );

  static readonly TRX_1 = new Account(
    Currency.TRX,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    0,
    undefined,
  );

  static readonly TRX_2 = new Account(
    Currency.TRX,
    "Tron 2",
    "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
    1,
    undefined,
  );

  static readonly TRX_3 = new Account(
    Currency.TRX,
    "Tron 3",
    "TWBAMUMc69Z82zJtXh1TqdPyWv7PNyud6p",
    2,
    undefined,
  );

  static readonly XRP_1 = new Account(
    Currency.XRP,
    "XRP 1",
    "rhQvt8XfAGn1hVVtMUmdGKBUdnKzi2oimV",
    0,
    undefined,
  );

  static readonly XRP_2 = new Account(
    Currency.XRP,
    "XRP 2",
    "r36cgyrfC1xSQMvjuiSeFJEcBTq31imZS",
    1,
    undefined,
  );

  static readonly XRP_3 = new Account(
    Currency.XRP,
    "XRP 3",
    "rn2Z2yShWcvdTSQVo1EqjUpD1sjwBkZALb",
    2,
    undefined,
  );

  static readonly ADA_1 = new Account(
    Currency.ADA,
    "Cardano 1",
    "addr1q9q9q55zyew785z6c2lnrhnzghy038r6mepmqn6v28kupk5ug4c7v5lwwfjwgn4mnpzgmhrhp8xry804kuvfh6ru2ews8d5td8",
    0,
    undefined,
  );
  static readonly ADA_2 = new Account(
    Currency.ADA,
    "Cardano 2",
    "addr1qyjd47qfktpza4ycjddjadaarzwdumwrqws0xage8gvsmrq5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qwzv6ac",
    1,
    undefined,
  );

  static readonly ALGO_1 = new Account(
    Currency.ALGO,
    "Algorand 1",
    "HQ6YJWSVG3KVRE56V6UGWMUJLDVNPQUNXJBY7VJ56VMNMGIKVDTC7JEKOU",
    0,
    undefined,
  );

  static readonly ALGO_2 = new Account(
    Currency.ALGO,
    "Algorand 2",
    "6TFDU3BYQ2FO32SOYQDTHDW5XKGEYH4FCT34ZQRHFPJRVMLEQWOO2OEUU4",
    1,
    undefined,
  );

  static readonly ALGO_3 = new Account(
    Currency.ALGO,
    "Algorand 3",
    "3ASRTAN6KCZCICTIFQ5N2UBOSSBOZ7WFSOI2CJEJ4ESK532RODQZ7KCSOA",
    2,
    undefined,
  );

  static readonly XLM_1 = new Account(
    Currency.XLM,
    "Stellar 1",
    "GCAGRZ7XABYSXV7CPFSFWQIUK6XFXECBPWP2SGMVOB2KFWN7YM4TDGSX",
    0,
    undefined,
  );

  static readonly XLM_2 = new Account(
    Currency.XLM,
    "Stellar 2",
    "GCTGRCFN7AT6NW4DZVI4QN55BRNQA64TXEZSMYPE7BNUZMLMVISXT652",
    1,
    undefined,
  );

  static readonly BCH_1 = new Account(
    Currency.BCH,
    "Bitcoin Cash 1",
    "qz82kem69vdafku8xf4zpt9p5ytj8umwpujj7wjcv6",
    0,
    undefined,
  );

  static readonly BCH_2 = new Account(
    Currency.BCH,
    "Bitcoin Cash 2",
    "qp2ka732e6h82djvr5ge4vtru0cl3g8lxqtyfmzzl9",
    1,
    undefined,
  );

  static readonly ATOM_1 = new Account(
    Currency.ATOM,
    "Cosmos 1",
    "cosmos18sdl4lvyjtvpjkkt5smglux9sf4phdcpaddfae",
    0,
    undefined,
  );

  static readonly ATOM_2 = new Account(
    Currency.ATOM,
    "Cosmos 2",
    "cosmos12d854g9mut943gu5ncyhalapukttkddnvlxaq6",
    1,
    undefined,
  );

  static readonly XTZ_1 = new Account(
    Currency.XTZ,
    "Tezos 1",
    "tz1UD2zz5eFTW2Jy26kBnC3ZkdeazUgeFWST",
    0,
    undefined,
  );

  static readonly XTZ_2 = new Account(
    Currency.XTZ,
    "Tezos 2",
    "tz1g3uEPZ9T3AhUZDTbGW9V43JRfizJmSnPv",
    1,
    undefined,
  );

  static readonly POL_1 = new Account(
    Currency.POL,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
    undefined,
    undefined,
    [Nft.ANIME_SHIPS_494, Nft.BISHOP_OF_STORMS, Nft.COMMON_TOWER_MAP],
  );

  static readonly POL_2 = new Account(
    Currency.POL,
    "Polygon 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    undefined,
  );

  static readonly BSC_1 = new Account(
    Currency.BSC,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly NEAR_1 = new Account(
    Currency.NEAR,
    "NEAR 1",
    "70b2982a31cfcffc773145d2143392612bb83a22926c912e2ce3ec0634f637e2",
    0,
    undefined,
  );

  static readonly NEAR_2 = new Account(
    Currency.NEAR,
    "NEAR 2",
    "5effd8bfea3885b6f5f91256663e5af720b18761a96bd6592e210a23f950872c",
    1,
    undefined,
  );

  static readonly ETH_USDT_1 = new Account(
    Currency.ETH_USDT,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    TokenType.ERC20,
  );

  static readonly ETH_USDT_2 = new Account(
    Currency.ETH_USDT,
    "Ethereum 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    TokenType.ERC20,
  );

  static readonly ETH_USDC_1 = new Account(
    Currency.ETH_USDC,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    TokenType.ERC20,
  );

  static readonly ETH_LIDO = new Account(
    Currency.ETH_LIDO,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    TokenType.ERC20,
  );

  static readonly XLM_USCD = new Account(
    Currency.XLM_USCD,
    "Stellar 1",
    "GCAGRZ7XABYSXV7CPFSFWQIUK6XFXECBPWP2SGMVOB2KFWN7YM4TDGSX",
    0,
    undefined,
  );

  static readonly ALGO_USDT_1 = new Account(
    Currency.ALGO_USDT,
    "Algorand 1",
    "HQ6YJWSVG3KVRE56V6UGWMUJLDVNPQUNXJBY7VJ56VMNMGIKVDTC7JEKOU",
    0,
    undefined,
  );

  static readonly ALGO_USDT_2 = new Account(
    Currency.ALGO_USDT,
    "Algorand 2",
    "6TFDU3BYQ2FO32SOYQDTHDW5XKGEYH4FCT34ZQRHFPJRVMLEQWOO2OEUU4",
    1,
    undefined,
  );

  static readonly ALGO_USDT_3 = new Account(
    Currency.ALGO_USDT,
    "Algorand 3",
    "3ASRTAN6KCZCICTIFQ5N2UBOSSBOZ7WFSOI2CJEJ4ESK532RODQZ7KCSOA",
    2,
    undefined,
  );

  static readonly TRX_USDT = new Account(
    Currency.TRX_USDT,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    0,
    undefined,
  );

  static readonly TRX_BTT = new Account(
    Currency.TRX_BTT,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    0,
    TokenType.TRC20,
  );

  static readonly BSC_BUSD_1 = new Account(
    Currency.BSC_BUSD,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly BSC_BUSD_2 = new Account(
    Currency.BSC_BUSD,
    "Binance Smart Chain 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    1,
    undefined,
  );

  static readonly BSC_SHIBA = new Account(
    Currency.BSC_SHIBA,
    "Binance Smart Chain 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly POL_DAI_1 = new Account(
    Currency.POL_DAI,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly POL_UNI = new Account(
    Currency.POL_UNI,
    "Polygon 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    0,
    undefined,
  );

  static readonly EMPTY = new Account(Currency.BTC, "Empty", "", 0);

  static readonly ETH_2_LOWER_CASE = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0x43047a5023d55a8658fcb1c1cea468311adaa3ad",
    1,
    undefined,
  );

  static readonly MULTIVERS_X_1 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 1",
    "erd1kp2psapk98pjtxr0n583qlq9zurwdwaqcvgh7l5hyj6hh839p5dq82cuw9",
    0,
    undefined,
  );

  static readonly MULTIVERS_X_2 = new Account(
    Currency.MULTIVERS_X,
    "MultiversX 2",
    "erd10nxfga5uavl7pr8k5qptk49h2983erxznj7z3kpw28937z7gmf5sc7shug",
    1,
    undefined,
  );

  static readonly OSMO_1 = new Account(
    Currency.OSMO,
    "Osmosis 1",
    "osmo1w7v2v6v8z3r3d8x8h7yjv6w2k3c5w3z7w6v8v8",
    0,
    undefined,
  );

  static readonly OSMO_2 = new Account(
    Currency.OSMO,
    "Osmosis 2",
    "osmo12d854g9mut943gu5ncyhalapukttkddnyy4dkg",
    1,
    undefined,
  );

  static readonly CELO_1 = new Account(
    Currency.CELO,
    "Celo 1",
    "0x2268495dE776a536A5a9828b91F04d54d7d2Aa50",
    0,
    undefined,
  );

  static readonly SOL_GIGA_1 = new Account(
    Currency.SOL_GIGA,
    "Solana 1",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    0,
    TokenType.SPL,
    undefined,
    undefined,
    undefined,
    "4JLL8NzonhGQyfrhvuTy4fGeskB7db4gZ9NxhPWDVa87",
  );

  static readonly SOL_GIGA_2 = new Account(
    Currency.SOL_GIGA,
    "Solana 2",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
    1,
    TokenType.SPL,
    undefined,
    undefined,
    undefined,
    "5izbyRCwfbvqkD8q5mGbbFvWUZ6ZL4C5PTosARVNagiv",
  );

  static readonly SOL_GIGA_3 = new Account(
    Currency.SOL_GIGA,
    "Solana 3",
    "H96UPk6G9ktsVFn1bY9DXZjWFjEoayUddfuXu68S8BES",
    2,
    TokenType.SPL,
    undefined,
    undefined,
    undefined,
    "CbqhB9yEsubMoDXf7AANreJh3szUATQudHn3ajtdrWgm",
  );

  static readonly SOL_WIF_1 = new Account(
    Currency.SOL_WIF,
    "Solana 2",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    0,
    TokenType.SPL,
    undefined,
    undefined,
    undefined,
    "143nLxFLwxNtqEd2LxEJjjjLCsspcuxyt3y2FRuyFXdg",
  );

  static readonly SOL_WIF_2 = new Account(
    Currency.SOL_WIF,
    "Solana 2",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
    1,
    TokenType.SPL,
    undefined,
    undefined,
    undefined,
    "2but8QCrAqoEHzQt16hwzte41yWrB4dae4WsStwqfX3h",
  );
}
