import { BigNumber } from "bignumber.js";

import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { IconAccount } from "../../types";
import { buildTransaction } from "../../buildTransaction";
import { getFees, getStepPrice } from "../../api/node";
import getEstimatedFees from "../../getFeesForTransaction";
import * as logic from "../../logic";

jest.mock("../../buildTransaction");
jest.mock("../../api/node");
jest.mock("@ledgerhq/cryptoassets");
jest.mock("../../logic");

const mockedLogic = jest.mocked(logic);

describe("getEstimatedFees", () => {
  beforeAll(() => {
    (global as any).FEES_SAFETY_BUFFER = new BigNumber(100);
  });
  it("should fetch the estimated fees correctly", async () => {
    const account: IconAccount = {
      currency: { id: "icon" },
      spendableBalance: new BigNumber(1000),
      pendingOperations: [],
      iconResources: { nonce: 1 },
    } as any;

    const transaction = {
      amount: new BigNumber(100),
      recipient: "recipient-address",
      fees: new BigNumber(10),
    } as any;

    const unsignedTx = {
      /* mock unsigned transaction */
    };
    const stepLimit = new BigNumber(100000);
    const stepPrice = new BigNumber(10);

    (getAbandonSeedAddress as jest.Mock).mockReturnValue("fake-recipient-address");
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(100));
    (buildTransaction as jest.Mock).mockResolvedValue({ unsigned: unsignedTx });
    (getFees as jest.Mock).mockResolvedValue(stepLimit);
    (getStepPrice as jest.Mock).mockResolvedValue(stepPrice);

    const estimatedFees = await getEstimatedFees({ account, transaction });
    expect(estimatedFees.isEqualTo(stepLimit.multipliedBy(stepPrice))).toBe(true);
    expect(transaction.stepLimit).toEqual(stepLimit);
  });

  it("should return FEES_SAFETY_BUFFER if an error occurs", async () => {
    const account = {
      currency: { id: "icon" },
      spendableBalance: new BigNumber(1000),
      pendingOperations: [],
      iconResources: { nonce: 1 },
    } as any;

    const transaction = {
      amount: new BigNumber(100),
      recipient: "recipient-address",
      fees: new BigNumber(10),
    } as any;

    (getAbandonSeedAddress as jest.Mock).mockReturnValue("fake-recipient-address");
    mockedLogic.calculateAmount.mockReturnValue(new BigNumber(100));
    // @ts-expect-error type
    mockedLogic.FEES_SAFETY_BUFFER = new BigNumber(100);
    (buildTransaction as jest.Mock).mockRejectedValue(new Error("Error"));
    // Mock getFees and getStepPrice if necessary, but they won't be called in this test case

    const estimatedFees = await getEstimatedFees({ account, transaction });
    expect(estimatedFees.isEqualTo(new BigNumber(100))).toBe(true);
  });
});
