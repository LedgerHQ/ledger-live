import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "../types";

const kaspa: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "kaspa seed 1",
      apdus: `
            => e00500000d038000002c8001b20780000000
            <= 410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a515639000
            => e00500000d038000002c8001b20780000001
            <= 4104bb257a3f0b6bc2104539be649e6f7fe0b42e38c660500598fb1dc833b7ecbb1ae936620f824c868b223e57fe3596aef893a0158acf399811ed5c9aecd3aa7daa2027a38ef4c76455946be71692ee422b1fc40dc30952a8bf1ce961a534476035c89000
            => e00500000d038000002c8001b20780000002
            <= 410458c01d69f2acf06762efd78fa120ebafc2046ff76032e53c905486f687489bc8c9ae47c34c9649d0716a8fae51b81c505648f734e474bc20755fbf4faec1ba5f20066683f17eb2bd6b5bde0fcf9b7ca0d61f6824d06dd9a001fc6c0a0420e94c7b9000
            => e00500000d038000002c8001b20780000003
            <= 41047bd40aaad4248be903c6794cc849e305198dea116f26143893797a241ff40fd4ad9cc0ea19209b8efb6504194522da1216dcc6a1af607b66a9507fac411a48ae20f8d7758f081ebb7cd574ec0490e07c6a314cc741e1fe5e973a1c85792e9c49cf9000
            `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:kaspa:41047bd40aaad4248be903c6794cc849e305198dea116f26143893797a241ff40fd4ad9cc0ea19209b8efb6504194522da1216dcc6a1af607b66a9507fac411a48ae20f8d7758f081ebb7cd574ec0490e07c6a314cc741e1fe5e973a1c85792e9c49cf:",
        seedIdentifier:
          "41047bd40aaad4248be903c6794cc849e305198dea116f26143893797a241ff40fd4ad9cc0ea19209b8efb6504194522da1216dcc6a1af607b66a9507fac411a48ae20f8d7758f081ebb7cd574ec0490e07c6a314cc741e1fe5e973a1c85792e9c49cf",
        xpub: "41047bd40aaad4248be903c6794cc849e305198dea116f26143893797a241ff40fd4ad9cc0ea19209b8efb6504194522da1216dcc6a1af607b66a9507fac411a48ae20f8d7758f081ebb7cd574ec0490e07c6a314cc741e1fe5e973a1c85792e9c49cf",
        index: 3,
        blockHeight: 190169242,
        balance: "0",
        currencyId: "kaspa",
        lastSyncDate: "",
        spendableBalance: "0",
        operations: [],
        pendingOperations: [],
        derivationMode: "",
        operationsCount: 0,
        freshAddress: "kaspa:qrqsqtrgm2p5mtq74nfjns06jel4ehuyewrmd5g9860lzxzqe5rlun25ytcvm",
        freshAddressPath: "44'/111111'/3'/0/0",
        used: false,
      },
      transactions: [],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kaspa,
  },
};
