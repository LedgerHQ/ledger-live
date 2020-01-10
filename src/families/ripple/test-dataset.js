// @flow
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../__tests__/test-helpers/bridge";
import { NotEnoughSpendableBalance, NotEnoughBalanceBecauseDestinationNotCreated, InvalidAddressBecauseDestinationIsAlsoSource } from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "ripplejs"],
  currencies: {
    ripple: {
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
            {
              name: "operation amount to low to create the recipient account",
              transaction: fromTransactionRaw({
                family: "ripple",
                recipient: "rZvBc5e2YR1A9otS3r9DyGh3NDP8XLLp4",
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
                tag: "12345",
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
