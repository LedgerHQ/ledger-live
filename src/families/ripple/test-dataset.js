// @flow
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import {
  NotEnoughSpendableBalance,
  // NotEnoughBalanceBecauseDestinationNotCreated,
  InvalidAddressBecauseDestinationIsAlsoSource
} from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import { addNotCreatedRippleMockAddress } from "./bridge/mock";

const newAddress1 = "rZvBc5e2YR1A9otS3r9DyGh3NDP8XLLp4";

addNotCreatedRippleMockAddress(newAddress1);

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "ripplejs"],
  currencies: {
    ripple: {
      scanAccounts: [
        {
          name: "ripple seed 1",
          apdus: `
      => e002004015058000002c80000090800000000000000000000000
      <= 21023555225257bcd4649a451a6f5d1600a37c86e727b3c56427f2df2d085fbbad8a22724a667a524a48634d397147754d64554c474d376d553452696b71525934374678529000
      => e002004015058000002c80000090800000010000000000000000
      <= 210267925c331fcd8db90f1a95287eea7ce8ef73f9e5c0444ddcbe3aadfa9923a20c2272423670776f76737972465768505955736a6a3956334348636b393835516a6958699000
      => e002004015058000002c80000090800000020000000000000000
      <= 21037e1a0c07bcd5531b268f48f18fb3b8acb49058f9126180d7febc53ae839f058a22724d4c675159503775703578503366396f353146396b3171314a456639646f6141699000
      `
        }
      ],
      accounts: [
        {
          transactions: [
            {
              name: "not enough spendable balance with base reserve",
              transaction: fromTransactionRaw({
                family: "ripple",
                recipient: "rB6pwovsyrFWhPYUsjj9V3CHck985QjiXi",
                amount: "15000000",
                tag: null,
                fee: "1",
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("15000000"),
                estimatedFees: BigNumber("1"),
                errors: {
                  amount: new NotEnoughSpendableBalance()
                },
                warnings: {},
                totalSpent: BigNumber("15000001")
              }
            },
            // FIXME
            /*
            {
              name: "operation amount to low to create the recipient account",
              transaction: fromTransactionRaw({
                family: "ripple",
                recipient: newAddress1,
                amount: "10000000",
                tag: null,
                fee: "1",
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("10000000"),
                estimatedFees: BigNumber("1"),
                errors: {
                  amount: new NotEnoughBalanceBecauseDestinationNotCreated()
                },
                warnings: {},
                totalSpent: BigNumber("10000001")
              }
            },
            */
            {
              name: "recipient and sender must not be the same",
              transaction: fromTransactionRaw({
                family: "ripple",
                recipient: "rJfzRJHcM9qGuMdULGM7mU4RikqRY47FxR",
                amount: "10000000",
                tag: null,
                fee: "1",
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("10000000"),
                estimatedFees: BigNumber("1"),
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource()
                },
                warnings: {},
                totalSpent: BigNumber("10000001")
              }
            },
            {
              name: "Operation with tag succeed",
              transaction: fromTransactionRaw({
                family: "ripple",
                recipient: "rB6pwovsyrFWhPYUsjj9V3CHck985QjiXi",
                amount: "10000000",
                tag: 12345,
                fee: "1",
                feeCustomUnit: null,
                networkInfo: null
              }),
              expectedStatus: {
                amount: BigNumber("10000000"),
                estimatedFees: BigNumber("1"),
                errors: {},
                warnings: {},
                totalSpent: BigNumber("10000001")
              }
            }
          ],
          raw: {
            id:
              "libcore:1:ripple:xpub6BemYiVNp19a2SqH5MuUUuMUsiMU4ZLcXQgfoFxbRSRjPEuzcwcjx5SXezUhwcmgCTKGzuGAqHxRFSCn6YLAqydEdq11LVYENwxNC6ctwrv:",
            seedIdentifier:
              "02b96ea039567968d11d12e3195e4b6194a016c18511e51814e5cca03fcd800a29",
            name: "XRP 1",
            derivationMode: "",
            index: 0,
            freshAddress: "rJfzRJHcM9qGuMdULGM7mU4RikqRY47FxR",
            freshAddressPath: "44'/144'/0'/0/0",
            freshAddresses: [
              {
                address: "rJfzRJHcM9qGuMdULGM7mU4RikqRY47FxR",
                derivationPath: "44'/144'/0'/0/0"
              }
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "ripple",
            unitMagnitude: 6,
            lastSyncDate: "",
            balance: "31209950",
            xpub:
              "xpub6BemYiVNp19a2SqH5MuUUuMUsiMU4ZLcXQgfoFxbRSRjPEuzcwcjx5SXezUhwcmgCTKGzuGAqHxRFSCn6YLAqydEdq11LVYENwxNC6ctwrv"
          }
        }
      ]
    }
  }
};

export default dataset;
