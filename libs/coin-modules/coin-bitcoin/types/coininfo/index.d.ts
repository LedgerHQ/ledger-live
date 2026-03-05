declare module "coininfo" {
  export type Coin = Record<string, unknown>;

  export type Network = {
    main: CoinInfo;
  } & Partial<Testnet>;
  export type Testnet = {
    test: CoinInfo;
    regtest: CoinInfo;
    simnet: CoinInfo;
  };
  export type BitcoinNetwork = {
    main: CoinInfo;
  } & Testnet;

  export type CoinInfo = {
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
    seedsDns: Array<string>;
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

  export type BitcoinJS = Coin & {
    messagePrefix: string;
    bip32: {
      private: number;
      public: number;
    };
    bech32: string;
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
    dustThreshold: number;
  };

  export type Bitcore = Coin & {
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

  export type CoinName =
    | "bitcoincash"
    | "blk"
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
    | "qtum"
    | "rvn"
    | "rdd"
    | "x42"
    | "zcash";

  const coininfo: Record<CoinName, Network> & { bitcoin: BitcoinNetwork };
  export default coininfo;
}
