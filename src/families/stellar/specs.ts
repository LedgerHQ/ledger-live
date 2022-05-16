import expect from "expect";
import invariant from "invariant";
import BigNumber from "bignumber.js";
import type { Transaction } from "./types";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
  listTokensForCryptoCurrency,
} from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

const currency = getCryptoCurrencyById("stellar");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.1");
const reserve = parseCurrencyUnit(currency.units[0], "1.5");

const MAX_FEE = 5000;
const USDC_CODE = "USDC";
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

const stellar: AppSpec<Transaction> = {
  name: "Stellar",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Stellar",
  },
  mutations: [
    {
      name: "move ~50%",
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
            amount,
          },
          {
            recipient,
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
      test: ({ account, accountBeforeTransaction, operation, transaction }) => {
        // We don't know what the final fee will be until after the tx is
        // submitted. Using higher max fee to make sure tx doesn't time out.
        expect(account.balance.toNumber()).toBeLessThanOrEqual(
          accountBeforeTransaction.balance.minus(operation.value).toNumber()
        );

        if (transaction.memoValue) {
          expect(operation.extra).toMatchObject({
            memo: transaction.memoValue,
          });
        }

        // Transaction type "payment" can be either "payment" or "create_account"
        // (if account is not created).
        const getType = () => {
          switch (transaction.operationType) {
            case "payment":
              return /payment|create_account/;
            case "changeTrust":
              return /change_trust/;
            default:
              return "";
          }
        };

        expect(transaction.operationType).toMatch(getType());
      },
    },
    {
      name: "add USDC asset",
      maxRun: 1,
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(reserve), "balance is too low");

        const transaction = bridge.createTransaction(account);
        const assets = listTokensForCryptoCurrency(account.currency).map(
          (a) => a.id
        );
        const assetUSDC = assets.find((a) =>
          a.endsWith(`${USDC_CODE}:${USDC_ISSUER}`)
        );

        invariant(assetUSDC, "USDC asset not found");

        const updates: Array<Partial<Transaction>> = [
          {
            operationType: "changeTrust",
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
        expect(hasAsset).toBeTruthy();
      },
    },
  ],
};
export default {
  stellar,
};
