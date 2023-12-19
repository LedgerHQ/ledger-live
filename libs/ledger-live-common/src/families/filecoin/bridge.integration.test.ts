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
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 04a208ea1ff17aa9fff9ae63483f40f93cbbdfbbbe74e70fb8ab2a452e3ed65f86890d3cd43e7a78594b6e42573db3db9cbe4b378554b43624eac83ff783b2a3791501f12b13543456cf32f3918bfdcfe636cd0cb5730d29663136657672677662756b3368746634347272703634377a72777a75676c6b34796e6f6969767667699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000000000000
      <= 0406971d45d92c5cde8f791f3c49ce72af574864ca1ea2c1225b5f254d85261a991f2750ca649d94a5db4e5c34eedc1b82155bbd4b79f72d9dbab6f6213c4d9aa8150156a902a0af654cdf44a2fe214f51e22dfa2957dd2974316b327571666966706d76676e36726663377971753675706366783563737636356f6165776b63619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000001000000
      <= 04b02a1c4342ede2fa9a495da81ccd9fb3031bfa7f7286753e0678446f9ad94063dc1558004aa5a2bcfd8e057827a3ea2e39066d3cc4f8326cf69eddacf1566b2a1501dede9f9bb0eba5086e786272afdc27fbe5f1a3222974313333706a37673571356f7371713374796d6a7a6b377862683770733764697a63706e64647036719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000002000000
      <= 04ecd53569845f6c0f89b4ca77b7325b2fc7f7e6b270ca4f0b93ebac7136a1b421d787a90d224b5e0210f3fe744d1fc3f32193b876242962f5eba15dac9d7aaf3b1501ea72b9839a15de38e5384c0cb1ba4d873950da08297431356a7a6c7461343263787064727a6a796a71676c646f736e7134347662777169786372677062799000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000003000000
      <= 04a5f895ea339abf00648782209e344f0f2ef42534b6ecc1726244d736f21330f6cd49133f5fb45aa38f9279073016979c6e2b063834a250a56a4e289394ff98c015015a5e4406dcbca4e4298849d284d6207f1386042a2974316c6a7065696277347873736f696b6d696a686a696a76726170346a796d62626b627078716c67719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000004000000
      <= 042a9facb73e2b0a3338dc015832405bcb837d3a4607754ab426c8911a91422b9b9edd8ef54187352f1cbad4c7124bd09ffe6e0e8f51f343a071e8fbfc4f68252a150172f5414a36f074ef6252c53036291558af5c49102974316f6c3275637372773662326f36797373797579646d6b69766c637876797369716f6a6f777672619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000005000000
      <= 0485dd17aa895178ca1f12d9bba5b8dd1e5e89fc8be312b01c3352d5e562703ff8882e29ec361945e9d618678139e6074fa4014b0282c48f6b2a2ec7e0b22565961501be9bcaec46dd3918ab84667b21b29d83b28ab26e29743178326e347633636733753472726b34656d7a3573646d7535716f7a69766d746f6577656a7435699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080010000800000000000000000
      <= 0408dc3c78f9c78962f2b6ca0d25730909d8588510162080990b927f856b256f7c7fc0b72108d93a4e495b20f74d98a2dd7387fa1bc0eb79fdba4d76508ced568b15014daff9b25ed9cb7828531d3821f58a31791fe9942966316a777837746d733633686678716b63746475346364356d6b6766347237326d756c6470666661619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080020000800000000000000000
      <= 049b37aa36aa5ba0fee02b75517f238470530b9c0e796d4c75399e796d46a77ca3baf93f49f7e99074a53fe3ea032c8949c69e5b56ba004415827fc8ea0cd3f7e01501d336d60d4d2405db191637d909c6a9a9c77adf6b296631326d336e6d646b6e657163357767697767376d717472766a766864787678336c6c7473737378619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080030000800000000000000000
      <= 042b034863e343a29909287f182368739734fa6dcf584bf046f69a4be52314cda59c733dd190fa5d2a53d4e2a9d4e3595d040f52a78cc3d2d16f487f21d695cb9015012bee63a9f18f53b4002c4b43a835bc62512ab14829663166707867686b707272356a336961626d6a6e6232716e6e346d6a6973766d6b697070666a7a73619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080040000800000000000000000
      <= 041e301ab82013ce6730f6ffa5cdcfb083ebfe92479d1fedb2e2976043b8d4ddaa128feaf4f9e4c34fe4627e48424a5343aff21df26e8fd16e636d57e2cbc96cea150145540549a4d3d99d35f0494314641e144158418029663169766b616b736e6532706d7a326e70716a666272697a61366372617671716d6175636a736f77699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080050000800000000000000000
      <= 04458332576a57241e23fc1abae1852cf7476945afad06d52d7513768d576d70311737ab02b3761cfa8a2eb6703080109e03e2a41696342761343b5a90547ab8e515015395066dc51f1c7c53679328a8505a40200c4ddd2966316b6f6b716d336f6664346f6879753368736d756b717563326961716179746f353476656f7466719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080060000800000000000000000
      <= 045fb76c0fc5aae9043fd859b738e80e8111e15fa600c28984b65478ada8aeeacc77a96fbbfc7b9f637032ad61bdf969040c6c79ec3af428dc7f35e3138b53d2db1501ce88e77b882c697fa8b13104ccb35da37a5024942966317a32656f6f36346966727578376b66726765636d7a6d3235756e3566616a6575666b7a767466619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080070000800000000000000000
      <= 04365c9cb9a82e543ca937de97552899aabd2559ca43b13d06cb24e0aa8b0655d684b90ee0810c4e115ed7e681ccf69a9d884245411614119f5f2c5856947fd689150185d6687a521d066053fc8349cb9d8580cdf3a83f29663171786c67713673736475646761753734716e653478686d6671646737686b62376a6f34696666699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000001000000
      <= 04acc74bca6a4266105150ce83ee58501853ed0be806192e78cb9963d5cdc121defc2bbcf8f065f2dbc83d5c67a3ff0a04e58b492a16ac12662cad6494df5ac87b15017556a64db04a3f68d46f1625b46b42f69c1081862966316f766c6b6d746e716a69377772766470637973336932326336326f6262616d676f6b6d673335719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000002000000
      <= 0463a3f03f99d522c61878862a2af95169b44cd6893e34610ef19b61a786866c59e093e35f688256dc228df6dd4eb184aa82ac0fe484d4dd57edba5b749599b06215017b45bd8820d0b40db97000ceefd90e3e1d20a97b296631706e63333363626132633261336f6c716164686f3777696f68796f73626b6c33757065736365699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000003000000
      <= 041ab0410e23123d9c87cd9bd0e86f3009845004551b206964ba47eb9aa2e1e0c713a2451a5a37ff368d917a82e281d878a6b35d2c13fbc5203a19493995f0ed561501ef04708c9b3426bac71cad71fa14a8835cceaef329663135346368626465336771746c767279347676793775666669716e6f6d356c7874777865676b69719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000004000000
      <= 0493a3c1a51d1250417ce5e404f767071a9fea3568740f1179872bcdf14e848d2ea799ccbf6ba5e302cbfc98e041146731e26659e5a076e0232a75eca9484e00fd1501a5460f7fe7aaa677f3cd985242a034e730f4d0912966317576646136373768766b74687034366e74626a6566696275343479706a756572677076326f6d699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000005000000
      <= 049dc0c8e4f5c5a52d2c4808418fb5319c195148913830ba4bda5fd5b1354db2c7270d8f03fb5e583322c19827154a7da09e11a7face5d38ba379695a9ef2515441501acd3fafe9e12c3976077a822a0a27bc59e635afc29663176746a3776377536636c627a6f7964787661726b626974337977706767777834717a6e77707a719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000006000000
      <= 0465d32e7c107e34ae65e788b60822d17750d7bbe36bbe87a47e6be8c4d3657651216c3701c43b05226de7fea6725807161447499e158e266a5b6328fc78c8e2eb1501646bb67d440f20efdb7538953e927ee5202186312966316d7276336d376b656234716f3777337668636b7435657436347571636462727266796973636a799000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000007000000
      <= 04fac897ec19529faba56b18f4a6ccb348827ceda91f622474d2ffb61a3f5baf57d300b4699551be66661ea7a297842636df11ad39e879e12da81215869470bb7b150191fb94efa3c856bca45dd54d1934a166c4181a3c2966317368357a6a3335647a626c6c7a6a633532766772736e66626d336362716772346b6632746c73619000
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
