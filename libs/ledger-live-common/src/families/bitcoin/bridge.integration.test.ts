import { DatasetTest } from "@ledgerhq/types-live";

import "../../__tests__/test-helpers/setup";

import { testBridge } from "../../__tests__/test-helpers/bridge";
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

const dataset: DatasetTest<Transaction> = {
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

testBridge(dataset);
