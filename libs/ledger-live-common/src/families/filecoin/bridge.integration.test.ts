import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { getAccountBridge } from "../../bridge";
import { decodeAccountId, encodeAccountId, fromAccountRaw } from "../../account";
import { BigNumber } from "bignumber.js";
import { AmountRequired, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";

import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";

const SEED_IDENTIFIER = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_1 = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_2 = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ACCOUNT_3 = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const ACCOUNT_4 = "f01840380";

const filecoin: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "filecoin seed 1",
      apdus: `
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 04ca7b02cafdf36e8b4caaf530a96b949764af71b956b2a3328b7a10940794c860f574a9199be98bde3c261887fec8e5fd94bc5f104908bf5f992f52ef2a89abb015017ff83e316c2605c018ab3a6126d5d8ce0a3023e529663170373464346d6c6d657963346167666c686a71736e766f797a796664616937666d6b79736f32619000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000000000000
      <= 04d493dab3ff63d6f0673454f8f6d6adec08db19e8c0298c65cfcace76a10757774afdee518b15a8b82452531bcb7860eefce02a89ef9051037646f5d4d6bd74171501eac14c6468ac13f66f0e0ee3766472c7e98394ab297431356c6175797a646976716a376d33796f623372786d7a6473793775796866666c777968657572699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000001000000
      <= 040cbb57791d797268e34340565393f8a014ae754026159973fbe46bdcef3b6d28d155f4923256a2beb9bcff3bd39e5066d1c778306f28a2d4faa3a66dbf70453e150148c9b66fef1fce116652099bec6301ced31e56472974316a6465336d33377064376862637a737362676e36797979627a336a7234767368676370696b32619000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000002000000
      <= 04b5d3766bcfe150e887fe08355d8801901957d4f940ac33086b211cbd2879ccdb475765391f6bdc93329670c899e82ec212e9c90912117d002e5f8d4a25d6c6d01501917d45c3017ba05f783d3ff6c88921273a73daac297431736636756c717962706f7166363662356837336d72636a62653435686877766d6f737a6d7a71719000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000003000000
      <= 041e039416e7b916778a6a6fbcb7b3bce298fb46f084ba27b3f584f7fac52410140cbc275974f9dcb03dde23d39940833fca8d2998710323102e87e04a15e249a215019948a798f70a807872e490d53b50bb0315d494632974317466656b70676878626b61687134786573646b7477756633616d6b356a66646468346b613776699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000004000000
      <= 04eb83d066b4cb200f1632379f73b1ca6bff0fff17111f7e82a89c8433c6226b34139531f184499b333f31dc9937987a5536953eace7d8ba288aadd42d69d78dc01501d42efce0327edbdf975dcadf472de1d97b5003d1297431327178707a79627370336e35376632357a6c70756f6c7062336635766161367261796f68716a719000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000005000000
      <= 0407230f40bade572d4feeec0e3768789860227986e85b01bb4d462c1b517cd2cc5af4ce2097b06fda52176a542ecce4482291b4f6ece48d59fb9b2a1247f2418d1501d981129d32078f65537f1061f28cd00f005fb4832974313367617266686a73613668776b753337636271376664677162346166376e65647272737a6561619000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c00008001000080000000800000000006000000
      <= 0466a53388d30f8323cb39ca62cd261a63d43b6f1bbf05250ea7bef8077037ae74bfa6a42f5ef9757e53e713a9695c2de82cad06472385292c63337db0cbd80daa150144b33ed6e4940cce710c70146b8cfd18eb97f85929743169737a74357678657371676d3434696d6f616b67786468356464767a7036637a6b61756f377a799000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080010000800000000000000000
      <= 0463c18e9a3c08ecffab4fa384f977e5d380d2b252dbbd96875df9cc91c44c81e82639fd659a3eeeaed96901696d8c7832b03befafd0af6ab2bee634ea8141e52a15016f62da10a416f416e80ec32866b91f01f7746af82966316e35726e75656665633332626e32616f796d75676e6f693761683378693278796e766c746e71699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080020000800000000000000000
      <= 04f838a8b60e8c8ddaa40b164c458b32094be15606c261008fbb4a38d9d7fd63d0b3343f1e0b861b142774fa242234185f79d95e180609bf6c56ad38f36197bf3715010b485688119885d1fa4a27d026c7f30531a62936296631626e65666e636172746363356436736b653769636e723774617579326d6b6a7732796e676275799000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080030000800000000000000000
      <= 04e3493fab64823760f42c5fca00dc27a3eb9cb8ba0b52c498b940a7ec82bad70f8b68bd2c7d6cc4074eb08d24187d925fab1fa54dbe7c26f544fd53b454ebcacd1501188ac818a6471dc0c43deef4cc4fb3594a85885d2966316463666d7167666769346f34627262353533326d797435746c6666696c6363353236637a7578699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080040000800000000000000000
      <= 04851093dcfb51ae7eb3a085003c50a2f6ee635cc7192b713bd5d89301c1ce38d6ee44ec601b0c67218f502dfd7bc8bc96014e1db2f3754552507a5c313ebe0e2c1501ac247d637e126ed294b6761bf3877bda8f04d9002966317671736832793336636a786e666666776f796e3768623333336b68716a7769616b7a63616e32799000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080050000800000000000000000
      <= 04368d7fe53c84f52574cb0f9b0a78dcddf37d1b1e09e9c8a7bfab2e9bf06ce71a7ab0f453b938ffa093d1c8028b159bad8727b71a6508acbc2d530eb45ff9dab51501ec13e2bf751dd038dceb18db8447699bc67a3d6c29663135716a3666703376647869647278686c64646e796972336a7470646875706c6d6f656f717463699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080060000800000000000000000
      <= 0418de25cee71d38de134e9fede2c42c28c5a8b06a4643527fe61ac272e45e562d957b18d85364da0cce8ffb470a30dba6e1d56f68cbaffc25f2332932731227991501a223f50f49d9804314bd96636ae7f5267360aeb2296631756972376b64326a3367616567666635737a7277767a3776657a7a77626c7673776669347974699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000001000000
      <= 0419d91b4f9c3015637f5aa6b601b337f2770b1dcf93ba896d64627cd2aa67493ba924decd3024643478a84e06486b0a6b10d9f7607b6e92b0545bb3c998d4d75d15017ad86da94bab1ae1942e43050edb5f634b2d1ec9296631706c6d67336b6b6c766d6e6f6466626f696d6371357732376d6e66733268776a746173366769619000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000002000000
      <= 047fc6dc24f9c4bb243023b760637fc604c492da6406824f22592d96a4f435767c975d675b5aef0e160f87d2950860c50e2ab691f197033d234ce7af61fcded4b01501eb4fc162c42bfcf0572941424d3a2c603fc60176296631356e6834637977656670367061767a6a69666265326f726d6d6137346d616c77647979357266719000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000003000000
      <= 04b5a4495a2edc7d6e121715332fcac13a28e1167c702d0a3ddbb5a5ff9027182db0a4c94387ee5c9cdd53fb7474b968a9f1310225c02c375d10189b4fc5e1f24a150159b7be7dd3ba42bb42fe7b60d83b3c142c0943bf2966316c67333334376f74786a626c77717836706e716e716f7a346371776173713537796f32627863799000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000004000000
      <= 04b479cb2a3d8fe60534943f3bfad0e55ba4283d31974581e8d348623aeb4a3e15c8167a003c92dcf52e12ee253126faebc7d445bce8e347bdd26d8a2e53a46b3315014ea8e251c8a4987d19c35e3854547e33988f024c2966316a32756f65756f6975736d6832676f646c79346669766436676f6d693661736d7a6b6434376c699000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000005000000
      <= 04a2dc85c8669642342c476dfd7a85f23309c7c06df209ed6846815786a6740ab35f8b9024b1616780a39dea7a9e7a05b8e808539688f70ad1ad814889546e738815015fcfe6d5c16405f00e1f7ae60ea9bfb8173bf95e2966316c3768366e766f626d71633761647137706c7461356b6e3778616c7478366b366c3770617173719000
      => 0600000000
      <= 0000170800311000049000
      => 06010000142c000080cd010080000000800000000006000000
      <= 045d4460005b5218e70aac7e6d1d8980b24fae39c743fa50b2cfd0dd062b5f88ea27ea5fe614ff059e0a62691bb91774dea71f5b8c0bf57703688a05e1bb0b436a150146871b490baefaf7ffa3a8fba2357b71e005501a296631693264727773696c763335707037356476643532656e6c336f6871616b7561326d7368663566799000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:filecoin:${SEED_IDENTIFIER}:glif`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Filecoin 1",
        derivationMode: "" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/461'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "filecoin",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address (fil)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "novalidaddress",
            amount: "100000000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not a valid address (eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "0x689c9b3232210tt9b84ef444d0ef35d11102adjj",
            amount: "100000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "100000000000000000000",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "10",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "0",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f1)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f0)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_4,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (0x eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_3,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f4)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_2,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
            useAllAmount: true,
          }),
          expectedStatus: (account, tx, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    filecoin,
  },
};

testBridge(dataset);

describe("estimateMaxSpendable", () => {
  test("it should failed on invalid recipient", async () => {
    const accounts = dataset.currencies["filecoin"].accounts || [];
    const accountData = accounts[0];

    const account = fromAccountRaw({
      ...accountData.raw,
      id: encodeAccountId({
        ...decodeAccountId(accountData.raw.id),
        type: dataset.implementations[0],
      }),
    });

    const accountBridge = getAccountBridge(account);
    const estimate = async () => {
      await accountBridge.estimateMaxSpendable({
        account,
        transaction: { recipient: "notavalidrecipient" },
      });
    };

    await expect(estimate).rejects.toThrowError(new InvalidAddress());
  });
});
