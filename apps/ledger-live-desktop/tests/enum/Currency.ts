export class Currency {
  constructor(
    public readonly uiName: string,
    public readonly deviceName: string,
    public readonly address1: string,
    public readonly address2: string,
  ) {}

  static readonly BTC = new Currency(
    "Bitcoin",
    "BTC",
    "bc1qx7f9plgr8msjatkv0dw2ne8gguwfjqr6xyjp50",
    "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
  );
  static readonly tBTC = new Currency(
    "Bitcoin Testnet",
    "𝚝BTC",
    "tb1qjnl3f0lahssa62qvn6vm2fruejfc6e9x2r8c5z",
    "tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9",
  );
  static readonly ETH = new Currency(
    "Ethereum",
    "ETH",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  );
  static readonly tETH = new Currency(
    "Ethereum Holesky",
    "𝚝ETH",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  );
  static readonly SOL = new Currency(
    "Solana",
    "SOL",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
  );
  static readonly ADA = new Currency(
    "Cardano",
    "ADA",
    "addr1q9q9q55zyew785z6c2lnrhnzghy038r6mepmqn6v28kupk5ug4c7v5lwwfjwgn4mnpzgmhrhp8xry804kuvfh6ru2ews8d5td8",
    "addr1qx4tv7p6q4srm6c0kqf3sp2yp9aveuym530587lfcjsa0ag5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qffgxst",
  );
  static readonly DOT = new Currency(
    "Polkadot",
    "DOT",
    "15NKsw4AoSEgBJ5NpHDkAjUmqLRfeSuqZBzZXH9uRg6MWbo3",
    "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
  );
  static readonly TRX = new Currency(
    "Tron",
    "TRX",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
  );
  static readonly Ripple = new Currency(
    "Ripple",
    "XRP",
    "rhQvt8XfAGn1hVVtMUmdGKBUdnKzi2oimV",
    "TODO",
  );
}
