import { Currency } from "./Currency";

export enum Address {
  BTC = "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
  tBTC = "tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9",
  ETH = "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  SOL = "6vSQTFcBoPfUKAdo8BQNJqqxU6UcBmd87HQoNSbgTMzH",
  ADA = "addr1qx4tv7p6q4srm6c0kqf3sp2yp9aveuym530587lfcjsa0ag5ghmxjmdj4eylq78wur2gmm7gtqfq49v6mtdkaqwqzy2qffgxst",
  DOT = "12fY9vqzD8j1uvqSRx9y3gXRA1S3bwr5xunBVZvx1eeZFaHY",
  TRX = "TMGGi8n7kDkB8ws9wgunKf2SGNP4PjEyLL",
}

export const addresses: { [key in Currency["uiName"]]: string } = {
  [Currency.BTC.uiName]: Address.BTC,
  [Currency.tBTC.uiName]: Address.tBTC,
  [Currency.ETH.uiName]: Address.ETH,
  [Currency.tETH.uiName]: Address.ETH,
  [Currency.SOL.uiName]: Address.SOL,
  [Currency.ADA.uiName]: Address.ADA,
  [Currency.DOT.uiName]: Address.DOT,
  [Currency.TRX.uiName]: Address.TRX,
};
