import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { getEstimatedFees } from "./bridge/bridgeHelpers/fee";
import { InvalidMemoICP } from "./errors";

const SEED_IDENTIFIER =
  "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const ACCOUNT_2 =
  "fdb7db0d3ae67368cb5010b7de7d98566c072f0a4eda871f45cd6582bf08aeb4";

const internet_computer: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "internet_computer seed 1",
      apdus: `
      => 11010000142c000080df000080000000800000000000000000
      <= 04eaa9806ccad97e5319c32a847d001666141319bb8859541c1af183763ee4fb61ae771095fe21765547bb4252f10c5797b88f46553f0c0fa924a873937cc0aef270d693d3254cc0b6730e03e9f6691e409ea9ed6e8ff90d9897b3cb9e02e018d81c6da0016f94b6119a3195d87b9e2fbd1ee72ac00f518ddfacfa9e44bd6d72716a347a747132326a35676a6b6d7963336867647164356833677368736174327536323375703765677a726635747a6f7061659000
      => 11010000142c000080df000080000000800000000001000000
      <= 04a8bd22bccd1c89358add88bb210232fa158453813b67ff197d12dcd07c60ad6f4221e85aac6777eebdd3990431bf4ad535f31a55bf55b8a259fa899cab1e894b5e0fc9616ed285dcb3390cad72a50f5353f80c62c56b10830f5677f7029e6b45a585f066ca819a9176676c54a205dd34012fe7060bcd12d4373ed6bcb83666326f626d6b36623765776333777371786f6c676f696d76767a6b6b6432746b703461797977666e6d6969676432776f373371659000
      => 11010000142c000080df000080010000800000000000000000
      <= 04c7d610653a16b67bfd314ad3c12f58ad482f56b8bc18233e5c19ea9bd6c826331a88ed8b23bfbc9dad23813781873e60ee0631e9d2caeaf6a0e4c17578001f0c439e0f8ef56915341a92bd89311eb8cf6f1962abaa7dbae7186efdcb0265616a90d1b48e189a7278674e262a6479f14033830cfa82e2925bf5e908e0bd72687134697873647479687935356c6a637532627665763572657972356f67706e346d77666b356b7077356f6f67646f37786671659000
      => 11010000142c000080df000080020000800000000000000000
      <= 041d19162d440260df8876a1ae9ad8577363a7f94bd37b15f55d2475bcb0a29139d47ca1486886995b5ba150d8f000e3aa45734ce37568e2627f1184210393666f0a080941b0f64c85745a340ed835a1b6ce02b9c64a80bc536d7c6f2202a7eb4968316cb7c5ecc3728dd915690aa53bc0466fb410f5310465bbcdcd2abb327736756374696b62616575646d68776a7363786977727562336d646c696e777a79626c7472736b7163366667336c346e347261659000
      => 11010000142c000080df000080030000800000000000000000
      <= 0452b12384ab3f5c74274baf2a40eece8e84051c18758399f19f03089f6b9696eb9bb82cd48874938ca27db16dfdfc070d2219e72359f8a16fad7815cf799932d4d1aec878926a56a8175a408aedf4c1e12605a9ba42a1e6ee12aaa8fb027a92b3bbcba1e065b290973297023b9d41be10eb4b5f17077ec8e153362fcf2168727a6869356772763365687265746b6b3275626f777361726c77376a71706265796332746f73637568746f3465766b76643571659000
      => 11010000142c000080df000080040000800000000000000000
      <= 04922a0eeb197c50faab852c74fdd1277962073ce0fbab67c80a17a1f64b31623300be16466e473f5180798a25732cb740bbb97c6a05f8d4157be7523fe97375adede99b730c40982dfaf9a6ee90bd30b7767beb204fc37c013ed7e19402caad3ea7f7812e3a0d1be0577b31e6f6f29998d6b4041b6c745e44a2bd3d20fc357079326576376e35676e78676463617461773776366e673532696c326d66786f7a353677696370796e36616370777834676b61659000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:icp:${SEED_IDENTIFIER}:internet_computer`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "",
        derivationMode: "internet_computer" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/223'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "internet_computer",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: "novalidaddress",
            fees: getEstimatedFees().toString(),
            amount: "1000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: (300 * 1e9).toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Invalid transferID/Memo",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: "1000",
            memo: "-1",
          }),
          expectedStatus: {
            errors: {
              transaction: new InvalidMemoICP(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            amount: "0",
            fees: getEstimatedFees().toString(),
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "internet_computer",
            recipient: ACCOUNT_2,
            amount: "1000",
            fees: getEstimatedFees().toString(),
          }),
          expectedStatus: {
            amount: new BigNumber("1000"),
            errors: {},
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
    internet_computer,
  },
};

testBridge(dataset);
