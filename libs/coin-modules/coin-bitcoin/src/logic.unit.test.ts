import BigNumber from "bignumber.js";
import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  mapTxToOperations,
  inferTransactionSequenceNumberFromInputs,
  isValidRecipient,
} from "./logic";
import { TX } from "@ledgerhq/wallet-btc/index";

describe("mapTxToOperations", () => {
  it("should filter out outputs that have unknown in their address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [
          {
            address: "<unknown>",
          },
        ],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("should filter out outputs that have no address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [{}],
        inputs: [],
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(0);
  });

  it("shouldn't filter out outputs with address", () => {
    const ops = mapTxToOperations(
      {
        outputs: [
          {
            address: "myAddress",
            value: 1000,
          },
        ],
        inputs: [],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["myAddress"]),
      new Set(["changeAddress"]),
    );
    expect(ops.length).toEqual(1);
    expect(ops[0]?.type).toBe("IN");
  });

  it("should set transactionSequenceNumber when input sequence is defined and non-zero", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            sequence: 4294967293,
            output_hash: "abc",
            output_index: 0,
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    expect(ops[0]?.transactionSequenceNumber).toEqual(new BigNumber(4294967293));
  });

  it("should retain transactionSequenceNumber = 0 when explicitly set", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            sequence: 0,
            output_hash: "abc",
            output_index: 0,
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    expect(ops[0]?.transactionSequenceNumber).toEqual(new BigNumber(0)); // important: not undefined
  });

  it("should not include coinbase inputs (missing output_hash) in extra.inputs", () => {
    const ops = mapTxToOperations(
      {
        id: "coinbaseTx1",
        outputs: [
          {
            address: " ",
            value: 0,
            output_index: 0,
          },
          {
            address: "myAddress",
            value: 27122076730,
            output_index: 1,
          },
        ],
        inputs: [
          {
            input_index: 0,
            sequence: 0,
          },
        ],
        received_at: new Date().toISOString(),
        block: { height: 100, hash: "blockhash", time: new Date().toISOString() },
      } as unknown as TX,
      "digibyte",
      "accountId",
      new Set(["myAddress"]),
      new Set(),
    );

    expect(ops.length).toEqual(1);
    expect(ops[0]?.type).toBe("IN");
    expect(ops[0]?.extra.inputs).toEqual([]);
  });

  it("should keep all coinbase transactions when processed through mapTxToOperations", () => {
    const makeCoinbaseTx = (id: string, blockHeight: number, value: number) =>
      ({
        id,
        outputs: [
          { address: " ", value: 0, output_index: 0 },
          { address: "minerAddress", value, output_index: 1 },
        ],
        inputs: [{ input_index: 0, sequence: 0 }],
        received_at: new Date().toISOString(),
        block: { height: blockHeight, hash: `hash${blockHeight}`, time: new Date().toISOString() },
      }) as unknown as TX;

    const accountAddresses = new Set(["minerAddress"]);
    const changeAddresses = new Set<string>();

    const ops1 = mapTxToOperations(
      makeCoinbaseTx("cb1", 100, 27100000000),
      "digibyte",
      "accountId",
      accountAddresses,
      changeAddresses,
    );
    const ops2 = mapTxToOperations(
      makeCoinbaseTx("cb2", 101, 27200000000),
      "digibyte",
      "accountId",
      accountAddresses,
      changeAddresses,
    );
    const ops3 = mapTxToOperations(
      makeCoinbaseTx("cb3", 102, 27300000000),
      "digibyte",
      "accountId",
      accountAddresses,
      changeAddresses,
    );

    const allOps = [...ops1, ...ops2, ...ops3];
    expect(allOps.length).toEqual(3);
    expect(allOps.every(op => op?.extra?.inputs?.length === 0)).toBe(true);
  });

  it("should set transactionSequenceNumber to undefined when sequence is missing", () => {
    const ops = mapTxToOperations(
      {
        outputs: [],
        inputs: [
          {
            address: "inputAddr",
            value: 1000,
            output_hash: "abc",
            output_index: 0,
            // no sequence
          },
        ],
        received_at: new Date().toISOString(),
      } as unknown as TX,
      "bitcoin",
      "accountId",
      new Set(["inputAddr"]),
      new Set(),
    );

    expect(ops.length).toBe(1);
    // missing sequence implies 0xfffffffe (default)"
    expect(ops[0]?.transactionSequenceNumber).toEqual(new BigNumber(0xfffffffe));
  });
});

describe("inferTransactionSequenceNumberFromInputs", () => {
  it("returns undefined if no account inputs are provided", () => {
    const result = inferTransactionSequenceNumberFromInputs([]);
    expect(result).toBeUndefined();
  });

  it("returns exact sequence when all inputs have defined sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([
      { sequence: 0xfffffffe },
      { sequence: 0xfffffffd },
    ]);
    expect(result).toBe(0xfffffffd);
  });

  it("falls back to 0xfffffffe when some inputs are missing sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([
      { sequence: 0xfffffffd },
      {}, // missing sequence
    ]);
    expect(result).toBe(0xfffffffd);
  });

  it("defaults entirely to 0xfffffffe when all inputs are missing sequence", () => {
    const result = inferTransactionSequenceNumberFromInputs([{}, {}]);
    expect(result).toBe(0xfffffffe);
  });

  it("returns 0 when one of the sequences is explicitly 0", () => {
    const result = inferTransactionSequenceNumberFromInputs([{ sequence: 0 }, { sequence: 1 }]);
    expect(result).toBe(0);
  });
});

describe("Test isValidRecipient", () => {
  function t(address: string, currencyId: string, expectValid: boolean) {
    const currency = getCryptoCurrencyById(currencyId);
    if (expectValid) {
      return expect(isValidRecipient({ currency, recipient: address })).resolves.toBeNull();
    } else {
      return expect(isValidRecipient({ currency, recipient: address })).rejects.toBeInstanceOf(
        InvalidAddress,
      );
    }
  }
  test("Fail on non-existing currency", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "ontology", false));
  test("Fail on mainnet addr on bitcoin_testnet", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "bitcoin_testnet", false));
  test("Success on valid address", () =>
    t("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4", "bitcoin", true));
  test("Fail on invalid qtum address", () =>
    t("xCREYTgvdk3XzFNpdXkj35fZX4hJK2Ckpe", "qtum", false));
  test("Fail on invalid bch address", () =>
    t("qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg3", "bitcoin_cash", false));
  // TODO Enable once fixed in wallet-btc
  test.skip("Success on valid bch address", () =>
    t("qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2", "bitcoin_cash", true));
});
