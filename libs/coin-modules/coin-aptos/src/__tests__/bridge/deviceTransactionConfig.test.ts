import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import getDeviceTransactionConfig from "../../bridge/deviceTransactionConfig";
import { APTOS_PRECISION } from "../../constants";

const nonBreakableSpace = " ";

describe("deviceTransactionConfig", () => {
  test("coin transfer", () => {
    const account = createFixtureAccount();
    const parentAccount = null;
    const transaction = createFixtureTransaction({
      amount: BigNumber(123).shiftedBy(APTOS_PRECISION),
      fees: BigNumber(456),
    });
    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
    });

    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Transaction Fee",
        value: `0.00000456${nonBreakableSpace}APT`,
      },
      {
        type: "text",
        label: "Amount",
        value: `123${nonBreakableSpace}APT`,
      },
    ]);
  });

  test("stake", () => {
    const account = createFixtureAccount();
    const parentAccount = null;
    const transaction = createFixtureTransaction({
      amount: BigNumber(123).shiftedBy(APTOS_PRECISION),
      fees: BigNumber(456),
      recipient: "delegator id",
      mode: "stake",
    });
    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
    });

    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Transaction Fee",
        value: `0.00000456${nonBreakableSpace}APT`,
      },
      {
        type: "text",
        label: "Delegate to",
        value: "delegator id",
      },
      {
        type: "text",
        label: "Amount",
        value: `123${nonBreakableSpace}APT`,
      },
    ]);
  });

  test("unstake", () => {
    const account = createFixtureAccount();
    const parentAccount = null;
    const transaction = createFixtureTransaction({
      amount: BigNumber(123).shiftedBy(APTOS_PRECISION),
      fees: BigNumber(456),
      recipient: "delegator id",
      mode: "unstake",
    });
    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
    });

    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Transaction Fee",
        value: `0.00000456${nonBreakableSpace}APT`,
      },
      {
        type: "text",
        label: "Undelegate from",
        value: "delegator id",
      },
      {
        type: "text",
        label: "Amount",
        value: `123${nonBreakableSpace}APT`,
      },
    ]);
  });

  test("unstake", () => {
    const account = createFixtureAccount();
    const parentAccount = null;
    const transaction = createFixtureTransaction({
      amount: BigNumber(123).shiftedBy(APTOS_PRECISION),
      fees: BigNumber(456),
      mode: "withdraw",
    });
    const fields = getDeviceTransactionConfig({
      account,
      parentAccount,
      transaction,
    });

    expect(fields).toMatchObject([
      {
        type: "text",
        label: "Transaction Fee",
        value: `0.00000456${nonBreakableSpace}APT`,
      },
      {
        type: "text",
        label: "Amount",
        value: `123${nonBreakableSpace}APT`,
      },
    ]);
  });
});
