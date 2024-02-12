type Network = {
  main: CoinInfo;
} & Partial<Testnet>;
type Testnet = {
  test: CoinInfo;
  regtest: CoinInfo;
  simnet: CoinInfo;
};
type BitcoinNetwork = {
  main: CoinInfo;
} & Testnet;

type CoinInfo = {
  name: string;
  unit: string;
  per1?: number;
  messagePrefix?: string;

  testnet: boolean;
  toBitcoinJS: () => BitcoinJS;
  toBitcore: () => Bitcore;

  hashGenesisBlock: string;
  port: number;
  protocol: {
    magic: number;
  };
  bech32: string;
  // vSeeds
  seedsDns: Array<string>;
  // base58Prefixes
  versions: {
    bip32: {
      private: number;
      public: number;
    };
    bip44: number;
    private: number;
    public: number;
    scripthash: number;
  };
};

// export function coininfo(input: string): Coin?;

type BitcoinJS = Coin & {
  messagePrefix: string;
  bip32: {
    private: number;
    public: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  dustThreshold: null;
};
// export function toBitcoinJS(): BitcoinJS;

type Bitcore = Coin & {
  name: string;
  alias: string;
  pubkeyhash: number;
  privatekey: number;
  scripthash: number;
  xpubkey: number;
  xprivkey: number;
  networkMagic: number;
  port: number;
  dnsSeeds: Array<string>;
};
// export function toBitcore(): Bitcore;

type CoinName =
  | "bitcoincash"
  | "blk"
  // | "bitcoin"
  | "bitcoin gold"
  | "cbn"
  | "cit"
  | "dash"
  | "dnr"
  | "decred"
  | "digibyte"
  | "dogecoin"
  | "grs"
  | "litecoin"
  | "via"
  | "mon"
  | "nbt"
  | "nmc"
  | "peercoin"
  | "qtum"
  | "rvn"
  | "rdd"
  | "viacoin"
  | "vertcoin"
  | "x42"
  | "zcash";
declare const coininfo: Record<CoinName, Network> & { bitcoin: BitcoinNetwork };
export default coininfo;
