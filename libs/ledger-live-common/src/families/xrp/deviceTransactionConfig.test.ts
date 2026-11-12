import BigNumber from "bignumber.js";
import { getOptOutReview } from "@ledgerhq/coin-xrp/logic-public";
import type { Account } from "@ledgerhq/types-live";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import type { Transaction, TransactionStatus } from "./types";

jest.mock("@ledgerhq/coin-xrp/logic-public", () => ({ getOptOutReview: jest.fn() }));
jest.mock("../../bridge/generic-coin-framework/api/context", () => {
  return { buildContext: jest.fn((currencyId: string) => ({ currencyId })) };
});

const getOptOutReviewMock = jest.mocked(getOptOutReview);

function makeInput({
  amount = new BigNumber(0),
  estimatedFees = new BigNumber(0),
  tag = undefined,
}: {
  amount?: BigNumber;
  estimatedFees?: BigNumber;
  tag?: number | null | undefined;
}) {
  return {
    account: {} as never,
    parentAccount: null,
    transaction: { tag } as Transaction,
    status: { amount, estimatedFees } as TransactionStatus,
  };
}

function makeOptOutReview(overrides = {}) {
  return {
    flags: ["setNoRipple" as const],
    resetsQualityIn: false,
    resetsQualityOut: false,
    ...overrides,
  };
}

describe("getDeviceTransactionConfig", () => {
  it("returns no fields when amount and fees are zero and tag is not a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        tag: null,
      }),
    );

    expect(fields).toEqual([]);
  });

  it("returns amount and fees fields when both are non-zero", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        amount: new BigNumber(1),
        estimatedFees: new BigNumber(2),
      }),
    );

    expect(fields).toEqual([
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ]);
  });

  it("returns tag text field when tag is a number", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 12345,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "12345" }]);
  });

  it("includes tag when tag is 0", async () => {
    const fields = await getDeviceTransactionConfig(
      makeInput({
        tag: 0,
      }),
    );

    expect(fields).toEqual([{ type: "text", label: "Tag", value: "0" }]);
  });

  describe("opt-out", () => {
    const issuer = "rIssuer";
    const holder = "rHolder";
    const code = "A".repeat(40);
    const issuanceId = "B".repeat(48);
    const xrpAccount = {
      type: "Account",
      currency: { id: "ripple" },
      freshAddress: holder,
    };
    const tokenAccount = { type: "TokenAccount", parentId: "xrpAccount" };

    function makeOptOutTransaction(assetReference: string) {
      return { assetReference, mode: "optOut", assetOwner: issuer } as Transaction;
    }

    function getOptOutDeviceFields(assetReference: string, account: unknown = xrpAccount) {
      return getDeviceTransactionConfig({
        ...makeInput({}),
        account: account as never,
        parentAccount: account === xrpAccount ? null : (xrpAccount as Account),
        transaction: makeOptOutTransaction(assetReference),
      });
    }

    beforeEach(() => {
      getOptOutReviewMock.mockReset().mockResolvedValue(makeOptOutReview());
    });

    it("reviews the flags, the limit, a 40-hex currency, the issuer and the fees", async () => {
      await expect(getOptOutDeviceFields(code)).resolves.toEqual([
        { type: "text", label: "Flags", value: "Set No Ripple" },
        { type: "text", label: "Limit Amount", value: "0" },
        { type: "text", label: "Currency", value: code },
        { type: "text", label: "Issuer", value: issuer },
        { type: "fees", label: "Fees" },
      ]);
    });

    it("skips the currency of a 3-letter code", async () => {
      const fields = await getOptOutDeviceFields("USD");

      expect(fields.map(({ label }) => label)).toEqual(["Flags", "Limit Amount", "Issuer", "Fees"]);
    });

    it("reads the review of the main account, for a token account too", async () => {
      await getOptOutDeviceFields("USD", tokenAccount);

      expect(buildContext).toHaveBeenCalledWith("ripple");
      expect(getOptOutReviewMock).toHaveBeenCalledWith({ currencyId: "ripple" }, holder, {
        type: "iou",
        assetReference: "USD",
        assetOwner: issuer,
      });
    });

    it("lists a cleared No Ripple and a cleared freeze, each as a flag", async () => {
      getOptOutReviewMock.mockResolvedValue(
        makeOptOutReview({ flags: ["clearNoRipple", "clearFreeze"] }),
      );

      const fields = await getOptOutDeviceFields("USD");

      expect(fields.slice(0, 2)).toEqual([
        { type: "text", label: "Flags", value: "Clear No Ripple" },
        { type: "text", label: "Flags", value: "Clear Freeze" },
      ]);
    });

    it.each([
      ["quality in", { resetsQualityIn: true }, ["Quality In"]],
      ["quality out", { resetsQualityOut: true }, ["Quality Out"]],
      [
        "both qualities",
        { resetsQualityIn: true, resetsQualityOut: true },
        ["Quality In", "Quality Out"],
      ],
    ])(
      "lists the reset of %s, between the flags and the limit",
      async (_case, overrides, labels) => {
        getOptOutReviewMock.mockResolvedValue(makeOptOutReview(overrides));

        const fields = await getOptOutDeviceFields("USD");

        expect(fields.map(({ label }) => label)).toEqual([
          "Flags",
          ...labels,
          "Limit Amount",
          "Issuer",
          "Fees",
        ]);
        expect(fields.filter(({ label }) => label.startsWith("Quality"))).toEqual(
          labels.map(label => ({ label, type: "text", value: "0" })),
        );
      },
    );

    it("reviews the fees only for an MPT, whose fields are not listed yet", async () => {
      await expect(getOptOutDeviceFields(issuanceId)).resolves.toEqual([
        { type: "fees", label: "Fees" },
      ]);
      expect(getOptOutReviewMock).not.toHaveBeenCalled();
    });
  });
});
