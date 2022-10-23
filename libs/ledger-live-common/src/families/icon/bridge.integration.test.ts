import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import { InvalidAddressBecauseDestinationIsAlsoSource, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";

const TEST_ADDRESS =
  "hxe52720d9125586e64c745bf3c2c1917dbb46f9ba";

const icon: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "icon seed 1",
      apdus: `
      => e00200010d038000002c8049435880000000
      <= 410412390dae2cb8fa0f230c945c76a7343d6777643ff469899f5d950245170d07f5a0a786619f2c712d636c342b511047f7ad1f3a03c830686678ec9b00e78e4d272a6878666136333130633663333935303036346639376437323539346238383964353036623364636561323b2fb8440d6c3ae1d2077b031f9a80aeaf123f08fa7d50ed326c4f456c5f3c8d9000
      => e002000115058000002c80494358800000008000000080000000
      <= 4104a9c6e567c9ac6eaed19f0db9815d976a1907a1d7b932b8eac021481b6732b3649bd9f5e6e5205cc630e44028e270c6fe8c002bceff206ad0a34b68491b51e8e92a68786431323263343133313133633062646434336637386231623537396136383735353165326134323464f10194d8b4f84f70f7fac533a6bf886b4762291b4772d077eeb01796bd87819000
      => e002000115058000002c80494358800000008000000080000001
      <= 4104af139392d8b0931e92acc237c16c2ba8420d215fb079920dc7f493b83cca6321a961dd752df59f3b351b96ef9258b292741e3297240413937d49afe18f84bad12a68783964376532346565386166306339636261643039326364633433383130363666626634383439616169b5b4b8344c557a0201c83494fb9441ee40753a5ecbf64751708045690f734d9000
      => e002000115058000002c80494358800000008000000080000002
      <= 4104d89d6ebc3cc6be5d4a6c4562acb8ed65a9163fa2606a0aa0bd68282e8a28294796f00663695060f7db7dc295cef5255239c8409d9228482960d9463215f69f362a687862336334346139633864346361313430626433316232333231363837393762346236633730303866bd9c383a3b2d4282c792438bab6591f4e8a2d182a14497e791a5a0664b774c979000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:icon:${TEST_ADDRESS}:`,
        seedIdentifier: `${TEST_ADDRESS}`,
        name: "ICON 1",
        derivationMode: "",
        index: 0,
        freshAddress: `${TEST_ADDRESS}`,
        freshAddressPath: "44'/4801368'/0'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "icon",
        unitMagnitude: 0,
        lastSyncDate: "",
        balance: "299569965",
      },
      transactions: [
        {
          name: "recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "icon",
            recipient: `${TEST_ADDRESS}`,
            amount: "100000000",
            mode: "send",
            fees: "0.00125",
          }),
          expectedStatus: {
            amount: new BigNumber("100000000"),
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        }, {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "icon",
            recipient: "iconinv",
            amount: "100000000",
            mode: "send",
            fees: null,
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
            family: "icon",
            recipient:
              "erd1frj909pfums4m8aza596595l9pl56crwdj077vs2aqcw6ynl28wsfkw9rd",
            amount: "1000000000000000000000000",
            mode: "send",
            fees: null,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },],
    },
  ]
};
const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    icon,
  },
};
testBridge(dataset);