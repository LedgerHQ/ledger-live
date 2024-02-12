import { getMainMessage } from "./helpers";
import { parseAmountStringToNumber } from "./logic";

describe("getMainMessage", () => {
  it("should return delegate message with delegate and reward messages (claim rewards, compound)", () => {
    const exec = getMainMessage([
      {
        type: "delegate",
        attributes: [],
      },
      {
        type: "withdraw_rewards",
        attributes: [],
      },
    ]);
    expect(exec.type).toEqual("delegate");
  });

  it("should return unbond message with unbound and transfer messages", () => {
    expect(
      getMainMessage([
        {
          type: "unbond",
          attributes: [],
        },
        {
          type: "transfer",
          attributes: [],
        },
      ]).type,
    ).toEqual("unbond");
  });

  it("should return first transfer message with multiple transfer messages", () => {
    const firstTransfer = {
      type: "transfer",
      attributes: [],
    };
    expect(
      getMainMessage([
        firstTransfer,
        {
          type: "transfer",
          attributes: [],
        },
      ]),
    ).toEqual(firstTransfer);
  });

  it("should return redelegate message with delegate/redelegate messages", () => {
    expect(
      getMainMessage([
        {
          type: "delegate",
          attributes: [],
        },
        {
          type: "redelegate",
          attributes: [],
        },
      ]).type,
    ).toEqual("redelegate");
  });
});

describe("parseAmountStringToNumber", () => {
  it("should remove suffix of amount string correctly", () => {
    expect(parseAmountStringToNumber("1000000uatom", "uatom")).toEqual("1000000");
  });
  it("should remove prefix and suffix of amount string correctly", () => {
    expect(
      parseAmountStringToNumber(
        "56ibc/0025F8A87464A471E66B234C4F93AEC5B4DA3D42D7986451A059273426290DD5,512ibc/6B8A3F5C2AD51CD6171FA41A7E8C35AD594AB69226438DB94450436EA57B3A89,10000uatom",
        "uatom",
      ),
    ).toEqual("10000");
  });
});
