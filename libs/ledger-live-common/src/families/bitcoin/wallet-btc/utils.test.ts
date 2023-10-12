import BigNumber from "bignumber.js";
import { InputInfo, OutputInfo, TransactionInfo } from "./types";
import {
  lexicographicalIndexingTransactionInputs,
  lexicographicalIndexingTransactionOutputs,
} from "./utils";

/**
 * From the example in the spec
 * cf. https://en.bitcoin.it/wiki/BIP_0069
 * Expected result for 0a6a357e2f7796444e02638749d9611c008b253fb55f5dc88b739b230ed0c4c3 tx inputs
 */
// #region Expected result
const expectedInputsTest1: readonly Pick<InputInfo, "txHex" | "output_index">[] = Object.freeze([
  {
    txHex: "0e53ec5dfb2cb8a71fec32dc9a634a35b7e24799295ddd5278217822e0b31f57",
    output_index: 0,
  },
  {
    txHex: "26aa6e6d8b9e49bb0630aac301db6757c02e3619feb4ee0eea81eb1672947024",
    output_index: 1,
  },
  {
    txHex: "28e0fdd185542f2c6ea19030b0796051e7772b6026dd5ddccd7a2f93b73e6fc2",
    output_index: 0,
  },
  {
    txHex: "381de9b9ae1a94d9c17f6a08ef9d341a5ce29e2e60c36a52d333ff6203e58d5d",
    output_index: 1,
  },
  {
    txHex: "3b8b2f8efceb60ba78ca8bba206a137f14cb5ea4035e761ee204302d46b98de2",
    output_index: 0,
  },
  {
    txHex: "402b2c02411720bf409eff60d05adad684f135838962823f3614cc657dd7bc0a",
    output_index: 1,
  },
  {
    txHex: "54ffff182965ed0957dba1239c27164ace5a73c9b62a660c74b7b7f15ff61e7a",
    output_index: 1,
  },
  {
    txHex: "643e5f4e66373a57251fb173151e838ccd27d279aca882997e005016bb53d5aa",
    output_index: 0,
  },
  {
    txHex: "6c1d56f31b2de4bfc6aaea28396b333102b1f600da9c6d6149e96ca43f1102b1",
    output_index: 1,
  },
  {
    txHex: "7a1de137cbafb5c70405455c49c5104ca3057a1f1243e6563bb9245c9c88c191",
    output_index: 0,
  },
  {
    txHex: "7d037ceb2ee0dc03e82f17be7935d238b35d1deabf953a892a4507bfbeeb3ba4",
    output_index: 1,
  },
  {
    txHex: "a5e899dddb28776ea9ddac0a502316d53a4a3fca607c72f66c470e0412e34086",
    output_index: 0,
  },
  {
    txHex: "b4112b8f900a7ca0c8b0e7c4dfad35c6be5f6be46b3458974988e1cdb2fa61b8",
    output_index: 0,
  },
  {
    txHex: "bafd65e3c7f3f9fdfdc1ddb026131b278c3be1af90a4a6ffa78c4658f9ec0c85",
    output_index: 0,
  },
  {
    txHex: "de0411a1e97484a2804ff1dbde260ac19de841bebad1880c782941aca883b4e9",
    output_index: 1,
  },
  {
    txHex: "f0a130a84912d03c1d284974f563c5949ac13f8342b8112edff52971599e6a45",
    output_index: 0,
  },
  {
    txHex: "f320832a9d2e2452af63154bc687493484a0e7745ebd3aaf9ca19eb80834ad60",
    output_index: 0,
  },
]);
// #endregion

/**
 * From the example in the spec
 * cf. https://en.bitcoin.it/wiki/BIP_0069
 * Expected result for 28204cad1d7fc1d199e8ef4fa22f182de6258a3eaafe1bbe56ebdcacd3069a5f tx inputs
 * (same previous transaction hashes)
 */
// #region Expected result
const expectedInputsTestSamePreviousTxHashes: readonly Pick<InputInfo, "txHex" | "output_index">[] =
  Object.freeze([
    {
      txHex: "35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055",
      output_index: 0,
    },
    {
      txHex: "35288d269cee1941eaebb2ea85e32b42cdb2b04284a56d8b14dcc3f5c65d6055",
      output_index: 1,
    },
  ]);
// #endregion

/**
 * From the example in the spec
 * cf. https://en.bitcoin.it/wiki/BIP_0069
 * Expected result for 0a6a357e2f7796444e02638749d9611c008b253fb55f5dc88b739b230ed0c4c3 tx outputs
 */
// #region Expected result
const expectedOutputsTest1: readonly Pick<OutputInfo, "value" | "script">[] = Object.freeze([
  {
    value: new BigNumber("400057456"),
    script: Buffer.from("76a9144a5fba237213a062f6f57978f796390bdcf8d01588ac", "hex"),
  },
  {
    value: new BigNumber("40000000000"),
    script: Buffer.from("76a9145be32612930b8323add2212a4ec03c1562084f8488ac", "hex"),
  },
]);
// #endregion

/**
 * From the example in the spec
 * cf. https://en.bitcoin.it/wiki/BIP_0069
 * Expected result for 28204cad1d7fc1d199e8ef4fa22f182de6258a3eaafe1bbe56ebdcacd3069a5f tx outputs
 */
// #region Expected result
const expectedOutputsTest2: readonly Pick<OutputInfo, "value" | "script">[] = Object.freeze([
  {
    value: new BigNumber("100000000"),
    script: Buffer.from(
      "41046a0765b5865641ce08dd39690aade26dfbf5511430ca428a3089261361cef170e3929a68aee3d8d4848b0c5111b0a37b82b86ad559fd2a745b44d8e8d9dfdc0cac",
      "hex",
    ),
  },
  {
    value: new BigNumber("2400000000"),
    script: Buffer.from(
      "41044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
      "hex",
    ),
  },
]);
// #endregion

/**
 * Expected result for outputs with same amount
 */
// #region Expected result
const expectedOutputsTestSameAmount: readonly Pick<OutputInfo, "value" | "script">[] =
  Object.freeze([
    {
      value: new BigNumber("100000000"),
      script: Buffer.from(
        "41044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
        "hex",
      ),
    },
    {
      value: new BigNumber("100000000"),
      script: Buffer.from(
        "41046a0765b5865641ce08dd39690aade26dfbf5511430ca428a3089261361cef170e3929a68aee3d8d4848b0c5111b0a37b82b86ad559fd2a745b44d8e8d9dfdc0cac",
        "hex",
      ),
    },
  ]);
// #endregion

/**
 * Expected result for outputs with same script
 */
// #region Expected result
const expectedOutputsTestSameScript: readonly Pick<OutputInfo, "value" | "script">[] =
  Object.freeze([
    {
      value: new BigNumber("100000000"),
      script: Buffer.from(
        "41044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
        "hex",
      ),
    },
    {
      value: new BigNumber("200000000"),
      script: Buffer.from(
        "41044a656f065871a353f216ca26cef8dde2f03e8c16202d2e8ad769f02032cb86a5eb5e56842e92e19141d60a01928f8dd2c875a390f67c1f6c94cfc617c0ea45afac",
        "hex",
      ),
    },
  ]);
// #endregion

/**
 * randomly shuffle an array
 * Naive shuffle algorithm, good enough for this test
 * If you want to nitpick, a better shuffle algorithm would be the Fisher–Yates shuffle
 * cf. https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * cf. https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj
 */
const randomSuffle = <T>(arr: readonly T[]): readonly T[] => {
  return [...arr].sort(() => Math.random() - 0.5);
};

describe("BIP-69", () => {
  describe("lexicographicalIndexingTransactionInputs", () => {
    it.each([
      {
        desc: "should sort inputs",
        expected: expectedInputsTest1,
      },
      {
        desc: "should sort inputs with same previous transaction hashes",
        expected: expectedInputsTestSamePreviousTxHashes,
      },
    ])("$desc", ({ expected }) => {
      const inputs: TransactionInfo["inputs"] = randomSuffle(expected) as any;

      const result = lexicographicalIndexingTransactionInputs({ inputs });

      expect(result).toStrictEqual(expected);
    });
  });

  describe("lexicographicalIndexingTransactionOutputs", () => {
    it.each([
      {
        desc: "should sort outputs - 1",
        expected: expectedOutputsTest1,
      },
      {
        desc: "should sort outputs - 2",
        expected: expectedOutputsTest2,
      },
      {
        desc: "should sort outputs with same amount",
        expected: expectedOutputsTestSameAmount,
      },
      {
        desc: "should sort outputs with same script",
        expected: expectedOutputsTestSameScript,
      },
    ])("$desc", ({ expected }) => {
      const outputs: TransactionInfo["outputs"] = randomSuffle(expected) as any;

      const result = lexicographicalIndexingTransactionOutputs({ outputs });

      expect(result).toStrictEqual(expected);
    });
  });
});
