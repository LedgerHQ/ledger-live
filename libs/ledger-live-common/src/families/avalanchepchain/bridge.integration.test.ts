import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { AvalanchePChainAccountRaw, Transaction } from "./types";
import { BigNumber } from "bignumber.js";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import { FIVE_MINUTES, TWO_WEEKS, AVAX_MINIMUM_STAKE_AMOUNT } from "./utils";
import {
  AvalancheInvalidDateTimeError,
  AvalancheMinimumAmountError,
} from "./errors";

const avalanchepchain: CurrenciesData<Transaction, AvalanchePChainAccountRaw> =
  {
    scanAccounts: [
      {
        name: "avalanchepchain seed 1",
        apdus: `
      => 800300000f0000038000002c8000232880000000
      <= 2103828c8dad550959fba4b8b7aef4fff624ff514acbd5e5ea8095b2e714747eed7e0572f641ad2ae06b7d0d0e190e74af86732927ced7b828fef23589257bbed1e59000
      `,
      },
    ],
    FIXME_ignorePreloadFields: ["validators"],
    accounts: [
      {
        FIXME_tests: [
          "balance is sum of ops",
          "invalid recipient have a recipientError",
        ],
        raw: {
          id: "js:1:avalanchepchain:avax10u6rtayzscc8ds4l5tdyjm2uazh0enhj8gguh5:",
          seedIdentifier: "",
          xpub: "xpub6Cfxnaft2T7TZ5sr3istgn2uvjTzunaZdL1rGpNU3orLUQggKYFxHSo3Csf98QwJA7BASwmGWNTwu1tc7MMRh3TvkJ6aDV55f7re6wnj42t",
          derivationMode: "",
          index: 0,
          freshAddress: "avax10u6rtayzscc8ds4l5tdyjm2uazh0enhj8gguh5",
          freshAddressPath: "44'/9000'/0'/0/0",
          freshAddresses: [
            {
              address: "avax10u6rtayzscc8ds4l5tdyjm2uazh0enhj8gguh5",
              derivationPath: "44'/9000'/0'/0/0",
            },
          ],
          name: "Avalanche P-chain 1 - Nano X",
          balance: "0",
          blockHeight: 2168241,
          currencyId: "avalanchepchain",
          unitMagnitude: 9,
          operationsCount: 0,
          operations: [],
          pendingOperations: [],
          lastSyncDate: "",
          avalanchePChainResources: {
            publicKey:
              "03828c8dad550959fba4b8b7aef4fff624ff514acbd5e5ea8095b2e714747eed7e",
            chainCode:
              "0572f641ad2ae06b7d0d0e190e74af86732927ced7b828fef23589257bbed1e5",
            stakedBalance: "",
            delegations: [],
          },
        },
        transactions: [
          {
            name: "Same as Recipient",
            transaction: (t) => ({
              ...t,
              amount: new BigNumber(100),
              recipient: "avax10u6rtayzscc8ds4l5tdyjm2uazh0enhj8gguh5",
            }),
            expectedStatus: {
              errors: {
                recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
              },
              warnings: {},
            },
          },
          {
            name: "Delegation - Not enough balance to delegate",
            transaction: (t) => ({
              ...t,
              mode: "delegate",
              amount: new BigNumber(100),
            }),
            expectedStatus: {
              errors: {
                amount: new AvalancheMinimumAmountError(),
              },
              warnings: {},
            },
          },
          {
            name: "Delegation - AmountRequired",
            transaction: (t) => ({
              ...t,
              mode: "delegate",
              amount: new BigNumber(0),
            }),
            expectedStatus: {
              errors: {
                amount: new AmountRequired(),
              },
              warnings: {},
            },
          },
          {
            name: "Delegation - Under time threshold",
            transaction: (t) => ({
              ...t,
              mode: "delegate",
              amount: new BigNumber(AVAX_MINIMUM_STAKE_AMOUNT),
              recipient: "GW7CvXwkPFDsfFHrix1SA148NHF5ZnSXs",
              endTime: new BigNumber(
                Math.round(new Date().getTime() / 1000) + TWO_WEEKS
              ),
            }),
            expectedStatus: {
              errors: {
                time: new AvalancheInvalidDateTimeError(),
              },
              warnings: {},
            },
          },
          {
            name: "Delegation - Beyond time threshold",
            transaction: (t) => ({
              ...t,
              mode: "delegate",
              amount: new BigNumber(AVAX_MINIMUM_STAKE_AMOUNT),
              recipient: "GW7CvXwkPFDsfFHrix1SA148NHF5ZnSXs",
              endTime: new BigNumber(
                Math.round(new Date().getTime() / 1000) +
                  TWO_WEEKS +
                  FIVE_MINUTES
              ),
              maxEndTime: new BigNumber(
                Math.round(new Date().getTime() / 1000) + TWO_WEEKS
              ),
            }),
            expectedStatus: {
              errors: {
                time: new AvalancheInvalidDateTimeError(),
              },
              warnings: {},
            },
          },
        ],
      },
    ],
  };

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    avalanchepchain,
  },
};

testBridge(dataset);
