import { encodeAccountId } from "@ledgerhq/coin-framework/lib/account/accountId";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromTransactionRaw } from "../bridge/transaction";
import { Transaction } from "../types";

// Mock Canton addresses using SECP256R1-compatible format
export const mockCantonAddresses = {
  sender: "canton_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
  recipient1: "canton_2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a",
  recipient2: "canton_3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b",
  invalid: "invalid_canton_address",
};

// Mock public keys (SECP256R1 uncompressed format)
export const mockPublicKeys = {
  sender:
    "0x04" +
    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" +
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  recipient1:
    "0x04" +
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" +
    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
};

const mainAccId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "canton_network",
  xpubOrAddress: mockCantonAddresses.sender,
  derivationMode: "",
});

const fees = new BigNumber("1000");
const zero = new BigNumber(0);

const canton: DatasetTest<Transaction> = {
  implementations: ["mock"],
  currencies: {
    canton_network: {
      scanAccounts: [
        {
          name: "canton seed 1",
          unstableAccounts: true,
          apdus: `
          => e00200400d038000002c8000009080000000
          <= 2103c73f64083463fa923e1530af6f558204853873c6a45cbfb1f2f1e2ac2a5d989c2272734a4675764165634c333153513750594864504b6b3335625a456f78446d5231789000
          => e002004015058000002c80000090800000000000000000000000
          <= 2103d1adcff3e0cf1232b1416a75cd6f23b49dd6a25c69bc291a1f6783ec6825ec062272616765584842365134566276765764547a4b414e776a65435434485846434b58379000
          => e002004015058000002c80000090800000010000000000000000
          <= 21036da109ee84825eab0f55fb57bcf9ef0b05621e71fb0400266fb42d6f68f9487c2272425065393169766d67384347573450414e6f657555555173756d337470786a55469000
          => e002004015058000002c80000090800000020000000000000000
          <= 2102df9a55b79fb3668dac70fee7372806195841cd713ab8da9fba82240f9db8a23921725a76426335653259523141396f745333723944794768334e445038584c4c70349000
          `,
        },
      ],
      accounts: [
        {
          raw: {
            id: mainAccId,
            seedIdentifier: mockCantonAddresses.sender,
            name: "Canton 1",
            derivationMode: "",
            index: 0,
            freshAddress: mockCantonAddresses.sender,
            freshAddressPath: "44'/6767'/0'/0'/0'",
            blockHeight: 12345,
            operations: [],
            pendingOperations: [],
            currencyId: "canton_network",
            lastSyncDate: "2024-01-01T00:00:00.000Z",
            balance: "1000000000", // 1000 CANTON
            spendableBalance: "999999000", // 999.999 CANTON (reserving 1000 for fees)
            subAccounts: [],
          },
          transactions: [
            // Basic transaction tests
            {
              name: "recipient and sender must not be the same",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.sender,
                amount: "10000000",
                tokenId: "Amulet",
                fee: "1000",
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: fees,
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
                totalSpent: new BigNumber("10001000"),
              },
            },
            {
              name: "valid transaction with sufficient balance",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.recipient1,
                amount: "10000000", // 10 CANTON
                fee: "1000",
                tokenId: "Amulet",
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: fees,
                errors: {},
                warnings: {},
                totalSpent: new BigNumber("10001000"),
              },
            },
            {
              name: "transaction with insufficient balance",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.recipient1,
                amount: "2000000000", // 2000 CANTON (more than balance)
                fee: "1000",
                tokenId: "Amulet",
              }),
              expectedStatus: {
                amount: new BigNumber("2000000000"),
                estimatedFees: fees,
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
                totalSpent: new BigNumber("20001000"),
              },
            },
            {
              name: "transaction with invalid recipient address",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.invalid,
                amount: "10000000",
                tokenId: "Amulet",
                fee: "1000",
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: fees,
                errors: {
                  recipient: new InvalidAddress(),
                },
                warnings: {},
                totalSpent: new BigNumber("10001000"),
              },
            },
            {
              name: "transaction with zero amount",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.recipient1,
                amount: "0",
                tokenId: "Amulet",
                fee: "1000",
              }),
              expectedStatus: {
                amount: zero,
                estimatedFees: fees,
                errors: {
                  amount: new AmountRequired(),
                },
                warnings: {},
                totalSpent: fees,
              },
            },
            {
              name: "transaction with empty recipient",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: "",
                amount: "10000000",
                tokenId: "Amulet",
                fee: "1000",
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: fees,
                errors: {
                  recipient: new RecipientRequired(),
                },
                warnings: {},
                totalSpent: new BigNumber("10001000"),
              },
            },
            {
              name: "transaction with high fee",
              transaction: fromTransactionRaw({
                family: "canton",
                recipient: mockCantonAddresses.recipient1,
                amount: "10000000",
                tokenId: "Amulet",
                fee: "50000", // 50 CANTON fee
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: new BigNumber("50000"),
                errors: {},
                warnings: {},
                totalSpent: new BigNumber("10050000"),
              },
            },
          ],
        },
      ],
    },
  },
};

export { canton as dataset };
