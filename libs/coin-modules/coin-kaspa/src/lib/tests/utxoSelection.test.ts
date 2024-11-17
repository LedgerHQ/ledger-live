import { selectUtxos } from "../utxoSelection";
import { KaspaUtxo } from "../../types/bridge";
import { BigNumber } from "bignumber.js";

describe("selectUtxos function", () => {
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

  test("spending exactly the one UTXO with 2036mass", () => {
    const utxos = [sampleUtxo];
    const recipient_is_ecdsa = false;
    const amount = BigNumber(1_0000_0000 - 2036);
    const feerate = 1;

    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(1);
  });

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

  test("check ordering - higher fees - descending - 1 utxo needed", () => {
    const utxos = sampleUtxoSet;
    const recipient_is_ecdsa = false;
    const amount = BigNumber(1_0000_0000 - 50_000);
    const feerate = 2;

    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(1);
    expect(result[0].utxoEntry.amount.eq(BigNumber(10_0000_0000))).toBe(true);
  });

  test("check ordering - higher fees - descending - 2 utxos needed", () => {
    const utxos = sampleUtxoSet;
    const recipient_is_ecdsa = false;
    const amount = BigNumber(10_0000_0000); // 10 KAS -> need 2 utxos
    const feerate = 2;

    const result = selectUtxos(utxos, recipient_is_ecdsa, amount, feerate);

    expect(result.length).toBe(2);

    // check ordering
    expect(result[0].utxoEntry.amount.eq(BigNumber(10_0000_0000))).toBe(true);
  });
});
