import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";

// import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "../../types";
import {
  // NotEnoughSpendableBalance,
  // NotEnoughBalanceBecauseDestinationNotCreated,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";
import { addNotCreatedRippleMockAddress } from "./bridge/mock";
// import { formatCurrencyUnit } from "../../currencies";
const newAddress1 = "rZvBc5e2YR1A9otS3r9DyGh3NDP8XLLp4";
addNotCreatedRippleMockAddress(newAddress1);
// const rippleUnit = getCryptoCurrencyById("ripple").units[0];
const dataset: DatasetTest<Transaction> = {
  implementations: ["mock", "ripplejs"],
  currencies: {
    ripple: {
      scanAccounts: [
        {
          name: "ripple seed 1",
          unstableAccounts: true,
          // our account is getting spammed...
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
          transactions: [
            // FIXME

            /*
        {
          name: "not enough spendable balance with base reserve",
          transaction: fromTransactionRaw({
            family: "ripple",
            recipient: "rB6pwovsyrFWhPYUsjj9V3CHck985QjiXi",
            amount: "15000000",
            tag: null,
            fee: "1",
            feeCustomUnit: null,
            networkInfo: null,
          }),
          expectedStatus: {
            amount: BigNumber("15000000"),
            estimatedFees: BigNumber("1"),
            errors: {
              amount: new NotEnoughSpendableBalance(null, {
                minimumAmount: formatCurrencyUnit(
                  rippleUnit,
                  BigNumber("20"),
                  {
                    disableRounding: true,
                    useGrouping: false,
                    showCode: true,
                  }
                ),
              }),
            },
            warnings: {},
            totalSpent: BigNumber("15000001"),
          },
        },
        */
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
                recipient: "rageXHB6Q4VbvvWdTzKANwjeCT4HXFCKX7",
                amount: "10000000",
                tag: null,
                fee: "1",
                feeCustomUnit: null,
                networkInfo: null,
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: new BigNumber("1"),
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
                totalSpent: new BigNumber("10000001"),
              },
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
                networkInfo: null,
              }),
              expectedStatus: {
                amount: new BigNumber("10000000"),
                estimatedFees: new BigNumber("1"),
                errors: {},
                warnings: {},
                totalSpent: new BigNumber("10000001"),
              },
            },
          ],
          raw: {
            id: "ripplejs:2:ripple:rageXHB6Q4VbvvWdTzKANwjeCT4HXFCKX7:",
            seedIdentifier: "rageXHB6Q4VbvvWdTzKANwjeCT4HXFCKX7",
            name: "XRP 1",
            derivationMode: "",
            index: 0,
            freshAddress: "rageXHB6Q4VbvvWdTzKANwjeCT4HXFCKX7",
            freshAddressPath: "44'/144'/0'/0/0",
            freshAddresses: [],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "ripple",
            unitMagnitude: 6,
            lastSyncDate: "",
            balance: "21000310",
          },
        },
      ],
    },
  },
};

testBridge(dataset);
