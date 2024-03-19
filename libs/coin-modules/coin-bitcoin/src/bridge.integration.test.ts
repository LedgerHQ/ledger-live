import { DatasetTest } from "@ledgerhq/types-live";

import type { Transaction } from "./types";
import bitcoin from "./datasets/bitcoin";
import bitcoin_cash from "./datasets/bitcoin_cash";
import bitcoin_gold from "./datasets/bitcoin_gold";
import dash from "./datasets/dash";
import decred from "./datasets/decred";
import digibyte from "./datasets/digibyte";
import dogecoin from "./datasets/dogecoin";
import zencash from "./datasets/zencash";
import komodo from "./datasets/komodo";
import litecoin from "./datasets/litecoin";
import peercoin from "./datasets/peercoin";
import pivx from "./datasets/pivx";
import qtum from "./datasets/qtum";
import vertcoin from "./datasets/vertcoin";
import viacoin from "./datasets/viacoin";
import zcash from "./datasets/zcash";

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js", "mock"],
  currencies: {
    bitcoin,
    bitcoin_cash,
    bitcoin_gold,
    dash,
    decred,
    digibyte,
    dogecoin,
    zencash,
    komodo,
    litecoin,
    peercoin,
    pivx,
    qtum,
    vertcoin,
    viacoin,
    zcash,
  },
};

describe("Bitcoin bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});
