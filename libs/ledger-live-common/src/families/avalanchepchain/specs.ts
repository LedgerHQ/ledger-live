import invariant from "invariant";
import type {
  AvalanchePChainAccount,
  AvalanchePChainResources,
  Transaction,
} from "./types";
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
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("avalanchepchain");
const minimalAmount = parseCurrencyUnit(currency.units[0], "25");
const validator = FIGMENT_AVALANCHE_VALIDATOR_NODES[0];

const avalanche: AppSpec<Transaction> = {
  name: "Avalanche",
  currency: getCryptoCurrencyById("avalanchepchain"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Avalanche",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  mutations: [
    {
      name: "Delegate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(canDelegate(account), "can delegate");
        const {
          avalanchePChainResources,
        }: { avalanchePChainResources: AvalanchePChainResources } =
          account as AvalanchePChainAccount;
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
        const {
          avalanchePChainResources,
        }: { avalanchePChainResources: AvalanchePChainResources } =
          account as AvalanchePChainAccount;
        const {
          avalanchePChainResources: avalanchePChainResourcesBeforeTransaction,
        } = accountBeforeTransaction as AvalanchePChainAccount;
        invariant(avalanchePChainResources, "avalanchepchain");

        expect(
          (avalanchePChainResources as AvalanchePChainResources).stakedBalance
        ).toEqual(
          (
            avalanchePChainResourcesBeforeTransaction as AvalanchePChainResources
          ).stakedBalance.plus(operation.extra.stakeValue)
        );
      },
    },
  ],
};

export default {
  avalanche,
};
