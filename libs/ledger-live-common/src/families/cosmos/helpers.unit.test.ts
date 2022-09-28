import { getMainMessage } from "./helpers";

describe("getMainMessage", () => {
  it("should return reward message with delegate and reward messages (claim rewards, compound)", () => {
    const exec = getMainMessage([
      {
        type: "delegate",
        attributes: {},
      },
      {
        type: "withdraw_rewards",
        attributes: {},
      },
    ]);
    expect(exec.type).toEqual("withdraw_rewards");
  });

  it("should return unbond message with unbound and transfer messages", () => {
    expect(
      getMainMessage([
        {
          type: "unbond",
          attributes: {},
        },
        {
          type: "transfer",
          attributes: {},
        },
      ]).type
    ).toEqual("unbond");
  });

  it("should return first transfer message with multiple transfer messages", () => {
    const firstTransfer = {
      type: "transfer",
      attributes: {},
    };
    expect(
      getMainMessage([
        firstTransfer,
        {
          type: "transfer",
          attributes: {},
        },
      ])
    ).toEqual(firstTransfer);
  });

  it("should return redelegate message with delegate/redelegate messages", () => {
    expect(
      getMainMessage([
        {
          type: "delegate",
          attributes: {},
        },
        {
          type: "redelegate",
          attributes: {},
        },
      ]).type
    ).toEqual("redelegate");
  });
});
