import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { makeAccount } from "../common.fixtures";
import {
  eip1559Tx,
  erc1155Transaction,
  legacyTx,
  nftEip1559tx,
  nftLegacyTx,
  tokenTransaction,
} from "../transaction.fixtures";
import { getGasTracker } from "@ledgerhq/coin-evm/network";
import { editedTransactionGasOptions } from "./gasOptions";
import { getEditTransactionPatch } from "./getEditTransactionPatch";
import { getMinEip1559Fees, getMinLegacyFees } from "./getMinEditTransactionFees";

jest.mock("./gasOptions", () => ({ editedTransactionGasOptions: jest.fn() }));
const mockedEditedTransactionGasOptions = jest.mocked(editedTransactionGasOptions);

jest.mock("@ledgerhq/coin-evm/network");
const mockedGetGasTracker = jest.mocked(getGasTracker);

jest.mock("./getMinEditTransactionFees");
const mockedGetMinLegacyFees = jest.mocked(getMinLegacyFees);
const mockedGetMinEip1559Fees = jest.mocked(getMinEip1559Fees);

const mockedGetGasOptions = jest.fn();

jest.mock("@ledgerhq/coin-evm/config");

const currency = getCryptoCurrencyById("ethereum");
const account = makeAccount(
  "0x055C1e159E345cB4197e3844a86A61E0a801d856", // jacquie.eth
  currency,
);

const txByTypeAndMode = {
  0: {
    coin: legacyTx,
    erc20: legacyTx,
    erc721: nftLegacyTx,
    erc1155: { ...nftLegacyTx, mode: "erc1155" },
  },
  2: {
    coin: eip1559Tx,
    erc20: tokenTransaction,
    erc721: nftEip1559tx,
    erc1155: erc1155Transaction,
  },
};

const gasOptionFastAndMinFeesByTypeAndTest = {
  0: {
    "<": {
      gasOptions: {
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(9),
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(10),
          nextBaseFee: null,
        },
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(11),
          nextBaseFee: null,
        },
      },
      minFees: {
        gasPrice: new BigNumber(1000),
      },
    },
    ">": {
      gasOptions: {
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(9),
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(10),
          nextBaseFee: null,
        },
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(1100),
          nextBaseFee: null,
        },
      },
      minFees: {
        gasPrice: new BigNumber(1000),
      },
    },
    "==": {
      gasOptions: {
        slow: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(9),
          nextBaseFee: null,
        },
        medium: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(10),
          nextBaseFee: null,
        },
        fast: {
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: new BigNumber(1000),
          nextBaseFee: null,
        },
      },
      minFees: {
        gasPrice: new BigNumber(1000),
      },
    },
  },
  2: {
    "<": {
      gasOptions: {
        slow: {
          maxFeePerGas: new BigNumber(9),
          maxPriorityFeePerGas: new BigNumber(1),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        medium: {
          maxFeePerGas: new BigNumber(10),
          maxPriorityFeePerGas: new BigNumber(2),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        fast: {
          maxFeePerGas: new BigNumber(11),
          maxPriorityFeePerGas: new BigNumber(3),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
      },
      minFees: {
        maxFeePerGas: new BigNumber(110),
        maxPriorityFeePerGas: new BigNumber(30),
      },
    },
    ">": {
      gasOptions: {
        slow: {
          maxFeePerGas: new BigNumber(9),
          maxPriorityFeePerGas: new BigNumber(1),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        medium: {
          maxFeePerGas: new BigNumber(10),
          maxPriorityFeePerGas: new BigNumber(2),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        fast: {
          maxFeePerGas: new BigNumber(1100),
          maxPriorityFeePerGas: new BigNumber(300),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
      },
      minFees: {
        maxFeePerGas: new BigNumber(110),
        maxPriorityFeePerGas: new BigNumber(30),
      },
    },
    "==": {
      gasOptions: {
        slow: {
          maxFeePerGas: new BigNumber(9),
          maxPriorityFeePerGas: new BigNumber(1),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        medium: {
          maxFeePerGas: new BigNumber(10),
          maxPriorityFeePerGas: new BigNumber(2),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
        fast: {
          maxFeePerGas: new BigNumber(110),
          maxPriorityFeePerGas: new BigNumber(30),
          gasPrice: null,
          nextBaseFee: new BigNumber(4),
        },
      },
      minFees: {
        maxFeePerGas: new BigNumber(110),
        maxPriorityFeePerGas: new BigNumber(30),
      },
    },
  },
};

describe.each(["speedup", "cancel"])("with editType %s", editType => {
  beforeEach(() => {
    // The source reads config via `getCurrencyConfiguration` (live-common LiveConfig); the value
    // only flows into the mocked gasTracker, so a minimal entry is enough to avoid "Config not set".
    LiveConfig.setConfig({
      config_currency_ethereum: { type: "object", default: {} },
    } as never);
  });

  describe("without gasTracker", () => {
    beforeEach(() => {
      mockedGetGasTracker.mockImplementation(() => null);
    });

    afterEach(() => {
      mockedGetGasTracker.mockReset();
    });

    it("should throw an error", async () => {
      await expect(
        getEditTransactionPatch({
          editType: editType as any,
          transaction: eip1559Tx,
          account,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe("with gasTracker", () => {
    beforeEach(() => {
      mockedGetGasTracker.mockImplementation(() => ({
        getGasOptions: mockedGetGasOptions,
      }));
    });

    afterEach(() => {
      mockedGetGasTracker.mockReset();
    });

    describe.each([{ txType: 0 }, { txType: 2 }])("with transaction type $txType", ({ txType }) => {
      describe.each([{ cond: "<" }, { cond: ">" }, { cond: "==" }])(
        "with gasOptionFast $cond minFees",
        ({ cond }) => {
          const { gasOptions, minFees } = gasOptionFastAndMinFeesByTypeAndTest[txType][cond];

          beforeEach(() => {
            if (txType === 0) {
              mockedGetMinLegacyFees.mockReturnValue(minFees);
            } else {
              mockedGetMinEip1559Fees.mockReturnValue(minFees);
            }

            mockedGetGasOptions.mockReturnValueOnce(Promise.resolve(gasOptions));
          });

          afterEach(() => {
            if (txType === 0) {
              mockedGetMinLegacyFees.mockReset();
            } else {
              mockedGetMinEip1559Fees.mockReset();
            }

            mockedGetGasOptions.mockReset();
          });

          it.each([{ mode: "coin" }, { mode: "erc20" }, { mode: "erc721" }, { mode: "erc1155" }])(
            "should return the expected patch for $mode transaction",
            async ({ mode }) => {
              const transaction = txByTypeAndMode[txType][mode];

              const patch = await getEditTransactionPatch({
                editType: editType as any,
                transaction,
                account,
              });

              expect(patch).toMatchSnapshot();
            },
          );
        },
      );
    });
  });
});

describe("through the portfolio layer", () => {
  const { gasOptions, minFees } = gasOptionFastAndMinFeesByTypeAndTest[2][">"];

  beforeEach(() => {
    LiveConfig.setConfig({
      config_currency_ethereum: { type: "object", default: { portfolio: { enabled: true } } },
    } as never);
    mockedGetMinEip1559Fees.mockReturnValue(minFees);
  });

  afterEach(() => {
    mockedGetMinEip1559Fees.mockReset();
    mockedEditedTransactionGasOptions.mockReset();
  });

  it("prices the patch from the gas options of the edited transaction's estimate", async () => {
    mockedEditedTransactionGasOptions.mockResolvedValue(gasOptions);

    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: eip1559Tx,
      account,
    });

    expect(mockedEditedTransactionGasOptions).toHaveBeenCalledWith(account, eip1559Tx);
    expect(mockedGetGasTracker).not.toHaveBeenCalled();
    expect(patch).toMatchObject({
      feesStrategy: "fast",
      gasOptions,
      maxFeePerGas: gasOptions.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasOptions.fast.maxPriorityFeePerGas,
    });
  });

  it("fails as without a gas tracker when the estimate carries no gas options", async () => {
    mockedEditedTransactionGasOptions.mockResolvedValue(undefined);

    await expect(
      getEditTransactionPatch({ editType: "cancel", transaction: eip1559Tx, account }),
    ).rejects.toThrow("No gas tracker found for currency ethereum");
  });
});
