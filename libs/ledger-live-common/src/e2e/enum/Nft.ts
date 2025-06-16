export class Nft {
  constructor(
    public readonly collectionName: string,
    public readonly nftName: string,
    public readonly nftContract: string,
    public readonly nftStandard: string,
    public readonly tokenId?: number,
  ) {}

  static readonly ANTITUS = new Nft(
    "parallel",
    "Antius's Forecast",
    "0x76BE3b62873462d2142405439777e971754E8E77",
    "ERC-1155",
    10237,
  );

  static readonly PODIUM = new Nft(
    "Pointshark",
    "Podium",
    "0x4f3A894f0655E4Bea7f809C2ccEc0c5E43E7E7a9",
    "ERC-721",
    9,
  );

  static readonly NY_LA_MUSE = new Nft(
    "Rarible",
    "NY la muse",
    "0xB66a603f4cFe17e3D27B87a8BfCaD319856518B8",
    "ERC-1155",
    undefined,
  );

  static readonly ANIME_SHIPS_494 = new Nft(
    "Anime Ships",
    "494",
    "0x95CCfd0d848B96AdfF5bCfe757505c64a0048CA4",
    "ERC-1155",
    494,
  );

  static readonly BISHOP_OF_STORMS = new Nft(
    "Anichess Orb of Power",
    "Bishop of Storms",
    "0x473989BF6409D21f8A7Fdd7133a40F9251cC1839",
    "ERC-1155",
    3,
  );

  static readonly COMMON_TOWER_MAP = new Nft(
    "TOWER Inventory",
    "Common TOWER Map",
    "0x2B88Ce7b01E6BdBB18f9703e01286608cF77e805",
    "ERC-1155",
    22,
  );
}
