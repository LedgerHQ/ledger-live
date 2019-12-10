// @flow
import { BigNumber } from "bignumber.js";
import { FeeTooHigh } from "@ledgerhq/errors";
import type { DatasetTest } from "../dataset";
import type { NetworkInfoRaw, Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";

const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      { key: "0", speed: "high", feePerByte: "3" },
      { key: "1", speed: "standard", feePerByte: "2" },
      { key: "2", speed: "low", feePerByte: "1" }
    ],
    defaultFeePerByte: "1"
  }
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["libcore", "mock"],
  currencies: {
    bitcoin: {
      accounts: [
        {
          transactions: [
            {
              name: "on legacy recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
                amount: "999",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("999"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1249"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            },
            {
              name: "on segwit recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "34N7XoKANmM66ZQDyQf2j8hPaTo6v5X8eA",
                amount: "998",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("998"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1248"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            },
            {
              name: "on native segwit recipient",
              transaction: fromTransactionRaw({
                family: "bitcoin",
                recipient: "bc1qqmxqdrkxgx6swrvjl9l2e6szvvkg45all5u4fl",
                amount: "997",
                feePerByte: "1",
                networkInfo
              }),
              expectedStatus: {
                amount: BigNumber("997"),
                // FIXME fee are reloaded?
                // estimatedFees: BigNumber("250"),
                // totalSpent: BigNumber("1247"),
                errors: {},
                warnings: {
                  feeTooHigh: new FeeTooHigh()
                }
              }
            }
          ],
          raw: {
            id:
              "libcore:1:bitcoin:xpub6Bm5P7Xyx2UYrVBAgb54gEswXhbZaryZSWsPjeJ1jpb9K9S5UTD5z5cXW4EREkTqkNjSHQHxwHKZJVE7TFvftySnKabMAXAQCMSVJBdJxMC:",
            seedIdentifier:
              "04b9b3078fbdef02b5f5aa8bb400423d5170015da06c31ad7745160cbab1fa4cdc965f271b924c2999639211310f6d35029698749b38ea7e64608de3ebcdbaa46a",
            name: "Bitcoin 1 (legacy)",
            derivationMode: "",
            index: 0,
            freshAddress: "1ATftUjdUKXQX6bBPzARUqongDWjNCLMhH",
            freshAddressPath: "44'/0'/0'/0/82",
            freshAddresses: [
              {
                address: "1ATftUjdUKXQX6bBPzARUqongDWjNCLMhH",
                derivationPath: "44'/0'/0'/0/82"
              }
            ],
            pendingOperations: [],
            operations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            balance: "2825",
            blockHeight: 0,
            lastSyncDate: "",
            xpub:
              "xpub6Bm5P7Xyx2UYrVBAgb54gEswXhbZaryZSWsPjeJ1jpb9K9S5UTD5z5cXW4EREkTqkNjSHQHxwHKZJVE7TFvftySnKabMAXAQCMSVJBdJxMC"
          }
        },
        {
          raw: {
            id:
              "libcore:1:bitcoin:xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2:native_segwit",
            seedIdentifier:
              "043188c7e9e184aa3f6c2967b9b2b19a5966efe88c526ac091687642540573ecfb4c988261e7b0b876c6aec0b393518676232b34289a5bfc0cc78cc2ef735fa512",
            name: "Bitcoin 2 (native segwit)",
            derivationMode: "native_segwit",
            index: 1,
            freshAddress: "bc1qwqfns0rs5zxrrwf80k4xlp4lpnuyc69feh2r3d",
            freshAddressPath: "84'/0'/1'/0/24",
            freshAddresses: [
              {
                address: "bc1qwqfns0rs5zxrrwf80k4xlp4lpnuyc69feh2r3d",
                derivationPath: "84'/0'/1'/0/24"
              }
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "150084",
            xpub:
              "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2"
          }
        }
      ]
    },
    dogecoin: {
      accounts: [
        {
          raw: {
            id:
              "libcore:1:dogecoin:dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF:",
            seedIdentifier:
              "044c892c19c1873fa73dabee9942e551fafe49d3fd12dacd6a25c421d7c712bc136c61295d195ded6d366121cfe0a1aa2a1df548680fbfcabe868233bc12e2d772",
            name: "Dogecoin 1",
            derivationMode: "",
            index: 0,
            freshAddress: "DCovDUyAFueFmK2QVuW5XDtaUNLa2LP72n",
            freshAddressPath: "44'/3'/0'/0/6",
            freshAddresses: [
              {
                address: "DCovDUyAFueFmK2QVuW5XDtaUNLa2LP72n",
                derivationPath: "44'/3'/0'/0/6"
              }
            ],
            blockHeight: 2869296,
            operations: [],
            pendingOperations: [],
            currencyId: "dogecoin",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "286144149366",
            xpub:
              "dgub8rBqrhN2grbuDNuFBCu9u9KQKgQmkKaa15Yvnf4YznmvqFZByDPJypigogDKanefhrjj129Ek1W13zvtyQSD6HDpzxyskJvU6xmhD29S9eF"
          }
        }
      ]
    },
    zcash: {
      accounts: [
        {
          raw: {
            id:
              "libcore:1:zcash:xpub6DXuLL97nvCs14Ashf3u8N2X9BLBpxN3HKCQWnLzn61o6CqME3Jm1hZ6oBeXcMhkqGDaziTGmw19w5iRstuXJrKLX6khbDt1rEatozTkf97:",
            seedIdentifier:
              "04ccf669020e2e315fb2ffdb98e6f60fed7b4abed8a013f5fd1bd604f7742207feef8cffcf1aca7f08628dea1abbcf1170b80ccf3809aa560996e5a5baaef4da33",
            name: "Zcash 1",
            derivationMode: "",
            index: 0,
            freshAddress: "t1gJ5fydzJKsTUkykzcVw1yDhHSc8FkULEB",
            freshAddressPath: "44'/133'/0'/0/43",
            freshAddresses: [
              {
                address: "t1gJ5fydzJKsTUkykzcVw1yDhHSc8FkULEB",
                derivationPath: "44'/133'/0'/0/43"
              }
            ],
            blockHeight: 597238,
            operations: [],
            pendingOperations: [],
            currencyId: "zcash",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "11000000",
            xpub:
              "xpub6DXuLL97nvCs14Ashf3u8N2X9BLBpxN3HKCQWnLzn61o6CqME3Jm1hZ6oBeXcMhkqGDaziTGmw19w5iRstuXJrKLX6khbDt1rEatozTkf97"
          }
        }
      ]
    }
  }
};

export default dataset;
