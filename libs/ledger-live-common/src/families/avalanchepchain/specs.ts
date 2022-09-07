import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { canDelegate } from "./utils";
import expect from "expect";
import { BigNumber } from "bignumber.js";
import {
  FIGMENT_AVALANCHE_VALIDATOR_NODES,
  TWO_WEEKS,
  FIVE_MINUTES,
  MINUTE,
} from "./utils";

const currency = getCryptoCurrencyById("avalanchepchain");
const minimalAmount = parseCurrencyUnit(currency.units[0], "25");
const validator = FIGMENT_AVALANCHE_VALIDATOR_NODES[0]; //TODO: just need to change this to an active validator and then I think the bot test should work

const avalanche: AppSpec<Transaction> = {
  name: "Avalanche",
  currency: getCryptoCurrencyById("avalanchepchain"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Avalanche",
  },
  testTimeout: 2 * 60 * 1000,
  mutations: [
    {
      name: "Delegate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(canDelegate(account), "can delegate");
        const { avalanchePChainResources } = account;
        invariant(avalanchePChainResources, "avalanche");

        const amount = minimalAmount;
        const stakeStartTime = new BigNumber(
          Math.round(new Date().getTime() / 1000) + MINUTE
        );
        const stakeEndTime = new BigNumber(
          Math.round(new Date().getTime() / 1000) + TWO_WEEKS + FIVE_MINUTES
        );
        const fees = new BigNumber(0);

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "delegate",
              recipient: validator,
              endTime: stakeEndTime,
              startTime: stakeStartTime,
              fees,
            },
            { amount },
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        const { avalanchePChainResources } = account;
        const {
          avalanchePChainResources: avalanchePChainResourcesBeforeTransaction,
        } = accountBeforeTransaction;
        invariant(avalanchePChainResources, "avalanchepchain");

        expect(avalanchePChainResources.stakedBalance).toEqual(
          avalanchePChainResourcesBeforeTransaction.stakedBalance.plus(
            operation.extra.stakeValue
          )
        );
      },
    },
  ],
};

export default {
  avalanche,
};
