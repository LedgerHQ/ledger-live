import { selectUtxos } from "../utxoSelection";
import { KaspaUtxo } from "../../types/bridge";
import { BigNumber } from "bignumber.js";

const DEFAULT_MASS_WITH_ONE_INPUT = 2036;
const MASS_PER_UTXO_INPUT = 1118;
const ADDTIONAL_MASS_FOR_ECDSA_OUTPUT = 200; // update with actual value if it differs

const sampleUtxo: KaspaUtxo = {
  address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
  outpoint: {
    transactionId: "44f1881957963cffa85b1ec531e3a195104248b11882229e53df6c6c77becdcc",
    index: 0,
  },
  utxoEntry: {
    amount: BigNumber(1_0000_0000), // 1 KAS
    scriptPublicKey: {
      version: 0,
      scriptPublicKey: "20c3e3cd358cba288acf955a6476b3c34562d0d7e4cb4b8750c12fa4685eb3b882ac",
    },
    blockDaaScore: "95538507",
    isCoinbase: false,
  },
  accountType: 0,
  accountIndex: 5,
} as KaspaUtxo;

const sampleUtxoSet: KaspaUtxo[] = [
  {
    address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
    outpoint: {
      transactionId: "44f1881957963cffa85b1ec531e3a195104248b11882229e53df6c6c77becdcc",
      index: 0,
    },
    utxoEntry: {
      amount: BigNumber(10_0000_0000), // 10 KAS
      scriptPublicKey: {
        version: 0,
        scriptPublicKey: "20c3e3cd358cba288acf955a6476b3c34562d0d7e4cb4b8750c12fa4685eb3b882ac",
      },
      blockDaaScore: "95538507",
      isCoinbase: false,
    },
    accountType: 0,
    accountIndex: 5,
  } as KaspaUtxo,
  {
    address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
    outpoint: {
      transactionId: "44f1881957963cffa85b1ec531e3a195104248b11882229e53df6c6c77becdcc",
      index: 0,
    },
    utxoEntry: {
      amount: BigNumber(5_0000_0000), // 5 KAS
      scriptPublicKey: {
        version: 0,
        scriptPublicKey: "20c3e3cd358cba288acf955a6476b3c34562d0d7e4cb4b8750c12fa4685eb3b882ac",
      },
      blockDaaScore: "95538507",
      isCoinbase: false,
    },
    accountType: 0,
    accountIndex: 5,
  } as KaspaUtxo,
  {
    address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
    outpoint: {
      transactionId: "44f1881957963cffa85b1ec531e3a195104248b11882229e53df6c6c77becdcc",
      index: 0,
    },
    utxoEntry: {
      amount: BigNumber(1_0000_0000), // 1 KAS
      scriptPublicKey: {
        version: 0,
        scriptPublicKey: "20c3e3cd358cba288acf955a6476b3c34562d0d7e4cb4b8750c12fa4685eb3b882ac",
      },
      blockDaaScore: "95538507",
      isCoinbase: false,
    },
    accountType: 0,
    accountIndex: 5,
  } as KaspaUtxo,
];

describe("selectUtxos function with low-fee strategy", () => {
  test("error if spending more than 9997_964 with 2036 mass", () => {
    const utxos = [sampleUtxo];
    const recipient_is_ecdsa = false;
    const amount = BigNumber(1_0000_0000 - 2036 + 1);
    const feerate = 1;

    expect(() => selectUtxos(utxos, recipient_is_ecdsa, amount, feerate)).toThrow(Error);
  });

  test("check ordering - low fees - ascending - 1 utxo needed", () => {
    const utxos = sampleUtxoSet;
    const recipient_is_ecdsa = false;
    const amount = BigNumber(1_0000_0000 - 50_000);
    const feerate = 1;

    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(1);
    console.log("Amount", result[0].utxoEntry.amount.toNumber());
    expect(result[0].utxoEntry.amount.eq(BigNumber(1_0000_0000))).toBe(true);
  });

  test("check ordering - low fees - ascending - 2 utxos needed", () => {
    const utxos = sampleUtxoSet;

    const recipient_is_ecdsa = false; // amount nee
    const amount = BigNumber(1_0000_0000 - 2036 + 1);
    const feerate = 1;

    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(2);
    expect(result[0].utxoEntry.amount.eq(BigNumber(1_0000_0000))).toBe(true);
  });
});
describe("selectUtxos function with high-fee strategy", () => {
  const feerate = 2;
  const utxos = sampleUtxoSet;
  const recipient_is_ecdsa = false;

  test("check ordering - higher fees - descending - 1 utxo needed", () => {
    const amount = BigNumber(4_0000_0000);
    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    // only one 5KAS UTXO needed
    expect(result.length).toBe(1);
    expect(result[0].utxoEntry.amount.eq(BigNumber(5_0000_0000))).toBe(true);
  });

  test("check ordering - higher fees - descending - 2 utxos needed", () => {
    const amount = BigNumber(5_0000_0000); // 10 KAS -> need 2 utxos
    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(1);

    // check utxos, 1 KAS and 5 KAS
    expect(result[0].utxoEntry.amount.eq(BigNumber(10_0000_0000))).toBe(true);
  });
});

describe("check if sending to ECDSA addresses is more expensive", () => {
  test("ECDSA tests with 11g heavier mass.", () => {
    const sendThisUtxo: KaspaUtxo = {
      address: "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
      outpoint: {
        transactionId: "44f1881957963cffa85b1ec531e3a195104248b11882229e53df6c6c77becdcc",
        index: 0,
      },
      utxoEntry: {
        amount: BigNumber(2036 + 10_0000_0000), // 1 KAS
        scriptPublicKey: {
          version: 0,
          scriptPublicKey: "20c3e3cd358cba288acf955a6476b3c34562d0d7e4cb4b8750c12fa4685eb3b882ac",
        },
        blockDaaScore: "95538507",
        isCoinbase: false,
      },
      accountType: 0,
      accountIndex: 5,
    } as KaspaUtxo;

    const amount = BigNumber(10_0000_0000); // 10 KAS -> need 2 utxos
    const feerate = 1;
    const res1 = selectUtxos([sendThisUtxo], false, amount, feerate);
    expect(res1.length).toBe(1);
    expect(() => selectUtxos([sendThisUtxo], true, amount, feerate)).toThrow(Error);

    // lower amount with 10 sompi - still not enough!
    expect(() => selectUtxos([sendThisUtxo], true, amount.minus(BigNumber(10)), feerate)).toThrow(
      Error,
    );

    // lower amount with 11 sompi ( exactly the ecdsa feature ) - it should work now!
    const res2 = selectUtxos([sendThisUtxo], true, amount.minus(BigNumber(11)), feerate);
    expect(res2.length).toBe(1);
  });
});
