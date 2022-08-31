import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "../../currencies";
import {
  createLockMutation,
  createRegisterAccountMutation,
  createSend50PercentMutation,
  createSendMaxMutation,
  createUnlockMutation,
  createVoteMutation,
  createActivateVoteMutation,
  createRevokeVoteMutation,
  createWithdrawMutation,
} from "./specs/index";
import type { AppSpec } from "../../bot/types";
import type { Transaction } from "./types";
import { acceptTransaction } from "./speculos-deviceActions";

const currency = getCryptoCurrencyById("celo");
const send50PercentMutation = createSend50PercentMutation();
const sendMaxMutation = createSendMaxMutation();
const registerAccountMutation = createRegisterAccountMutation();
const unlockMutation = createUnlockMutation();
const lockMutation = createLockMutation();
const voteMutation = createVoteMutation();
const activateVoteMutation = createActivateVoteMutation();
const revokeVoteMutation = createRevokeVoteMutation();
const withdrawMutation = createWithdrawMutation();

const celo: AppSpec<Transaction> = {
  name: "Celo",
  currency,
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Celo",
  },
  testTimeout: 2 * 60 * 1000,
  genericDeviceAction: acceptTransaction,
  mutations: [
    send50PercentMutation,
    sendMaxMutation,
    registerAccountMutation,
    unlockMutation,
    lockMutation,
    voteMutation,
    activateVoteMutation,
    revokeVoteMutation,
    withdrawMutation,
  ],
};

export default {
  celo,
};
