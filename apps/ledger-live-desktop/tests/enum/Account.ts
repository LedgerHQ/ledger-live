import { Currency } from "./Currency";

export class Account {
  constructor(
    public readonly currency: Currency,
    public readonly accountName: string,
    public readonly address: string,
    public readonly addressForSendTest: string,
  ) {}

  static readonly BTC_1 = new Account(
    Currency.BTC,
    "Bitcoin 1",
    "bc1qx7f9plgr8msjatkv0dw2ne8gguwfjqr6xyjp50",
    "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
  );

  static readonly BTC_2 = new Account(
    Currency.BTC,
    "Bitcoin 2",
    "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
    "bc1qx7f9plgr8msjatkv0dw2ne8gguwfjqr6xyjp50",
  );

  static readonly tBTC_1 = new Account(
    Currency.tBTC,
    "Bitcoin Testnet 1",
    "tb1qjnl3f0lahssa62qvn6vm2fruejfc6e9x2r8c5z",
    "tb1qyjr6hsx3wvsdq998zvn5cusqkdyfvvnpnsz6a5",
  );

  static readonly tBTC_2 = new Account(
    Currency.tBTC,
    "Bitcoin Testnet 2",
    "tb1qyjr6hsx3wvsdq998zvn5cusqkdyfvvnpnsz6a5",
    "tb1qjnl3f0lahssa62qvn6vm2fruejfc6e9x2r8c5z",
  );

  static readonly ADA_1 = new Account(
    Currency.ADA,
    "Cardano 1",
    "addr1q9q9q55zyew785z6c2lnrhnzghy038r6mepmqn6v28kupk5ug4c7v5lwwfjwgn4mnpzgmhrhp8xry804kuvfh6ru2ews8d5td8",
    "addr1qyjd47qfktpza4ycjddjadaarzwdumwrqws0xage8gvsmrq5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qwzv6ac",
  );

  static readonly ADA_2 = new Account(
    Currency.ADA,
    "Cardano 2",
    "addr1qyjd47qfktpza4ycjddjadaarzwdumwrqws0xage8gvsmrq5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qwzv6ac",
    "addr1q9q9q55zyew785z6c2lnrhnzghy038r6mepmqn6v28kupk5ug4c7v5lwwfjwgn4mnpzgmhrhp8xry804kuvfh6ru2ews8d5td8",
  );

  static readonly ETH_1 = new Account(
    Currency.ETH,
    "Ethereum 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  );

  static readonly ETH_2 = new Account(
    Currency.ETH,
    "Ethereum 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
  );

  static readonly tETH_1 = new Account(
    Currency.tETH,
    "Ethereum Holesky 1",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  );

  static readonly tETH_2 = new Account(
    Currency.tETH,
    "Ethereum Holesky 2",
    "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
    "0xB9051f83AC6e147924377BBEebd1Aa7aB43a67F6",
  );

  static readonly DOT_1 = new Account(
    Currency.DOT,
    "Polkadot 1",
    "15NKsw4AoSEgBJ5NpHDkAjUmqLRfeSuqZBzZXH9uRg6MWbo3",
    "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
  );

  static readonly DOT_2 = new Account(
    Currency.DOT,
    "Polkadot 2",
    "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
    "15NKsw4AoSEgBJ5NpHDkAjUmqLRfeSuqZBzZXH9uRg6MWbo3",
  );

  static readonly SOL_1 = new Account(
    Currency.SOL,
    "Solana 1",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
  );

  static readonly SOL_2 = new Account(
    Currency.SOL,
    "Solana 2",
    "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
    "HxoKQ5eu5MkqaAw7DaGVermrJqeNH8XkVnEKEpFuS9id",
  );

  static readonly TRX_1 = new Account(
    Currency.TRX,
    "Tron 1",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
    "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
  );

  static readonly TRX_2 = new Account(
    Currency.TRX,
    "Tron 2",
    "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
    "TDUKFB9wj3P5f2iNvkRuaDDeWVkTdUVhs1",
  );

  static readonly XRP_1 = new Account(
    Currency.XRP,
    "XRP 1",
    "rhQvt8XfAGn1hVVtMUmdGKBUdnKzi2oimV",
    "r36cgyrfC1xSQMvjuiSeFJEcBTq31imZS",
  );

  static readonly XRP_2 = new Account(
    Currency.XRP,
    "XRP 2",
    "r36cgyrfC1xSQMvjuiSeFJEcBTq31imZS",
    "rhQvt8XfAGn1hVVtMUmdGKBUdnKzi2oimV",
  );
}
