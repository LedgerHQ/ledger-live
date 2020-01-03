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
            "libcore:1:bitcoin:xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn:",
            seedIdentifier:
              "041caa3a42db5bdd125b2530c47cfbe829539b5a20a5562ec839d241c67d1862f2980d26ebffee25e4f924410c3316b397f34bd572543e72c59a7569ef9032f498",
            name: "Bitcoin 1 (legacy)",
            derivationMode: "",
            index: 0,
            freshAddress: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
            freshAddressPath: "44'/0'/0'/0/59",
            freshAddresses: [
              {
                address: "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe",
                derivationPath: "44'/0'/0'/0/59"
              }
            ],
            pendingOperations: [],
            operations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            balance: "2757",
            blockHeight: 0,
            lastSyncDate: "",
            xpub:
              "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn"
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
            freshAddress: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
            freshAddressPath: "84'/0'/1'/0/53",
            freshAddresses: [
              {
                address: "bc1q8vp7v5wyv8nvhsh5p2dvkgalep4q325kd5xk4e",
                derivationPath: "84'/0'/1'/0/53"
              }
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "bitcoin",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "2717",
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
