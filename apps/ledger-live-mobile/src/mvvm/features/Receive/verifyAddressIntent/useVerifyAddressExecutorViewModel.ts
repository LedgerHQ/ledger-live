import { accountsSlice } from "@domain/entity-account";
import {
  useVerifyAddressExecutorViewModel as useVerifyAddressExecutorWithPorts,
  type UseVerifyAddressExecutorViewModelParams,
} from "@features/flow-receive";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  toReceiveVerifyAccount,
  toReceiveVerifyAddressOptions,
} from "@ledgerhq/live-common/account/receiveVerifyAddress";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import getAddress from "@ledgerhq/live-common/hw/getAddress/index";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { accountSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import { useStore } from "~/context/hooks";
import { VerifyAddressIntentComponentLWM } from "./VerifyAddressIntentComponentLWM";

const { selectAccountLegacyId } = accountsSlice.getSelectors(
  (state: State) => state.accountEntries,
);

/** Gives the shared verification what only the legacy code has. */
export function useVerifyAddressExecutorViewModel(params: UseVerifyAddressExecutorViewModelParams) {
  const store = useStore();

  return useVerifyAddressExecutorWithPorts(params, {
    getAccount: accountUUID => {
      const state = store.getState();
      return accountSelector(state, {
        accountId: selectAccountLegacyId(state, accountUUID),
      });
    },
    findToken: assetId => getCryptoAssetsStore().findTokenById(assetId),
    getAddressOptions: (account, verification) =>
      toReceiveVerifyAddressOptions(account, verification),
    getAddress: ({ dmk, sessionId }, options) =>
      getAddress(new DmkCompatTransport(dmk, sessionId), options),
    buildInitializationInput: ({ account, tokenCurrency, verification }) =>
      buildDeviceInitializationInput({
        appRequest: { account: toReceiveVerifyAccount(account, verification), tokenCurrency },
        flow: FlowName.receive,
      }),
    intentComponent: VerifyAddressIntentComponentLWM,
  });
}
