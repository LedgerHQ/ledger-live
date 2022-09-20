import expect from "expect";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import type { Transaction } from "./types";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
  listTokensForCryptoCurrency,
} from "../../currencies";
import { botTest, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import type { SubAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("stellar");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const reserve = parseCurrencyUnit(currency.units[0], "1.5");

const MAX_FEE = 5000;
const USDC_CODE = "USDC";
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const USDC_ASSET_ID = `${USDC_CODE}:${USDC_ISSUER}`;
const MIN_ASSET_BALANCE = parseCurrencyUnit(currency.units[0], "0.01");

const findAssetUSDC = <T extends { id: string }>(subAccounts?: T[]) =>
  (subAccounts || []).find((s) => s.id.endsWith(USDC_ASSET_ID));

const stellar: AppSpec<Transaction> = {
  name: "Stellar",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Stellar",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: minAmountCutoff,
  mutations: [
    {
      name: "move ~50% XLM",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "XLM balance is too low");

        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        let amount = maxSpendable.div(1.9 + 0.2 * Math.random()).integerValue();

        if (!sibling.used && amount.lt(reserve)) {
          invariant(
            maxSpendable.gt(reserve.plus(minAmountCutoff)),
            "not enough XLM funds to send to new account"
          );
          amount = reserve;
        }

        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
            // Setting higher max fee here to make sure transaction doesn't
            // time out.
            fees: new BigNumber(MAX_FEE),
          },
          {
            amount,
          },
        ];

        if (Math.random() < 0.5) {
          updates.push({
            memoType: "MEMO_TEXT",
            memoValue: "Ledger Live",
          });
        }

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation, transaction }) => {
        // We don't know what the final fee will be until after the tx is
        // submitted. Using higher max fee to make sure tx doesn't time out.
        botTest("account balance decreased with operation", () =>
          expect(account.balance.toNumber()).toBeLessThanOrEqual(
            accountBeforeTransaction.balance.minus(operation.value).toNumber()
          )
        );

        if (transaction.memoValue) {
          botTest("operation memo", () =>
            expect(operation.extra).toMatchObject({
              memo: transaction.memoValue,
            })
          );
        }

        const getType = () => {
          switch (transaction.mode) {
            case "send":
              return "send";
            case "changeTrust":
              return /change_trust/;
            default:
              return "";
          }
        };

        botTest("transaction mode", () =>
          expect(transaction.mode).toMatch(getType())
        );
      },
    },
    {
      name: "Send max XLM",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "XLM balance is too low");

        const transaction = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;

        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
            // Setting higher max fee here to make sure transaction doesn't
            // time out.
            fees: new BigNumber(MAX_FEE),
          },
          {
            useAllAmount: true,
          },
        ];

        if (Math.random() < 0.5) {
          updates.push({
            memoType: "MEMO_TEXT",
            memoValue: "Ledger Live",
          });
        }

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation, transaction }) => {
        // We don't know what the final fee will be until after the tx is
        // submitted. Using higher max fee to make sure tx doesn't time out.
        botTest("balance decreased with operation", () =>
          expect(account.balance.toNumber()).toBeLessThanOrEqual(
            accountBeforeTransaction.balance.minus(operation.value).toNumber()
          )
        );

        if (transaction.memoValue) {
          botTest("operation memo", () =>
            expect(operation.extra).toMatchObject({
              memo: transaction.memoValue,
            })
          );
        }

        const getType = () => {
          switch (transaction.mode) {
            case "send":
              return "send";
            case "changeTrust":
              return /change_trust/;
            default:
              return "";
          }
        };

        botTest("transaction mode", () =>
          expect(transaction.mode).toMatch(getType())
        );
      },
    },
    {
      name: "add USDC asset",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(reserve), "XLM balance is too low 1");
        invariant(
          account.subAccounts && !findAssetUSDC(account.subAccounts),
          "already have subaccounts"
        );
        const assetUSDC = findAssetUSDC<TokenCurrency>(
          listTokensForCryptoCurrency(account.currency)
        );
        invariant(assetUSDC, "USDC asset not found");

        const transaction = bridge.createTransaction(account);

        const updates: Array<Partial<Transaction>> = [
          {
            mode: "changeTrust",
            // Setting higher max fee here to make sure transaction doesn't
            // time out.
            fees: new BigNumber(MAX_FEE),
          },
          {
            assetCode: USDC_CODE,
            assetIssuer: USDC_ISSUER,
          },
        ];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account }) => {
        const assetId = `${USDC_CODE}:${USDC_ISSUER}`;
        const hasAsset = account.subAccounts?.find((a) =>
          a.id.endsWith(assetId)
        );
        botTest("has asset", () => expect(hasAsset).toBeTruthy());
      },
    },
    {
      name: "move ~50% USDC asset",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "XLM balance is too low");

        const usdcSubAccount = findAssetUSDC<SubAccount>(account?.subAccounts);

        invariant(usdcSubAccount, "USDC asset not found");
        invariant(
          usdcSubAccount?.balance.gt(MIN_ASSET_BALANCE),
          "USDC balance is too low"
        );

        const siblingWithAssetUSDC = siblings.find((s) =>
          findAssetUSDC(s.subAccounts)
        );
        invariant(siblingWithAssetUSDC, "No siblings with USDC asset");

        if (!usdcSubAccount || !siblingWithAssetUSDC) {
          throw new Error("No USDC asset or sibling with USDC asset");
        }

        const transaction = bridge.createTransaction(account);
        const recipient = siblingWithAssetUSDC.freshAddress;
        const amount = usdcSubAccount.balance
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
          },
          {
            subAccountId: usdcSubAccount.id,
          },
          {
            amount,
            // Setting higher max fee here to make sure transaction doesn't
            // time out.
            fees: new BigNumber(MAX_FEE),
          },
        ];

        if (Math.random() < 0.5) {
          updates.push({
            memoType: "MEMO_TEXT",
            memoValue: "Ledger Live",
          });
        }

        return {
          transaction,
          updates,
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
        operation,
        transaction,
        status,
      }) => {
        const asset = findAssetUSDC<SubAccount>(account?.subAccounts);
        const assetBeforeTx = findAssetUSDC<SubAccount>(
          accountBeforeTransaction?.subAccounts
        );

        botTest("asset balance decreased with operation", () =>
          expect(asset?.balance.toString()).toBe(
            assetBeforeTx?.balance.minus(status.amount).toString()
          )
        );

        if (transaction.memoValue) {
          botTest("operation memo", () =>
            expect(operation.extra).toMatchObject({
              memo: transaction.memoValue,
            })
          );
        }
      },
    },
  ],
};
export default {
  stellar,
};
