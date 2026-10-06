import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { sendFeatures } from "../../../bridge/descriptor/send/features";
import { SINGLE_CALL_SIGNING_TIME, TRANSACTION_TYPE } from "../constants";
import { estimatedTime } from "./estimatedTime";

const privateTransaction = (amountRecords: number, hasFeeRecord: boolean) => ({
  family: "aleo",
  mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  properties: {
    amountRecordCommitments: Array.from({ length: amountRecords }, (_, i) => `record-${i}`),
    feeRecordCommitment: hasFeeRecord ? "fee-record" : null,
  },
});

describe("aleo estimated time", () => {
  it("counts a single signing call for a public send", () => {
    expect(
      estimatedTime.getEstimatedMs({ family: "aleo", mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
    ).toBe(SINGLE_CALL_SIGNING_TIME);
  });

  it("counts one signing call per amount record plus the fee record for a private send", () => {
    expect(estimatedTime.getEstimatedMs(privateTransaction(3, true))).toBe(
      4 * SINGLE_CALL_SIGNING_TIME,
    );
  });

  it("counts at least one signing call before any record is selected", () => {
    expect(estimatedTime.getEstimatedMs(privateTransaction(0, false))).toBe(
      SINGLE_CALL_SIGNING_TIME,
    );
  });

  it("has no estimate for a non-Aleo transaction", () => {
    expect(estimatedTime.getEstimatedMs({ family: "zcash" })).toBeNull();
  });

  it("is exposed through sendFeatures with its explainer", () => {
    const aleo = getCryptoCurrencyById("aleo");

    expect(sendFeatures.getEstimatedTime(aleo, privateTransaction(1, true))).toEqual({
      ms: 2 * SINGLE_CALL_SIGNING_TIME,
      translationKey: "estimatedTime.aleo",
      learnMoreUrl: "https://support.ledger.com/article/Aleo-ALEO",
    });
  });

  it("is absent for a coin that declares no estimate", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");

    expect(sendFeatures.getEstimatedTime(bitcoin, { family: "bitcoin" })).toBeNull();
  });
});
