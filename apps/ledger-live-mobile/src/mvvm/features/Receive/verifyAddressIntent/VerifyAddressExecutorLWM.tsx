import React, { useEffect, useMemo, useState } from "react";
import { accountsSlice } from "@domain/entity-account";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import {
  useVerifyAddressSession,
  type VerifyAddressOutcome,
  type VerifyAddressSelection,
  type VerifyAddressTracking,
} from "@features/flow-receive";
import {
  acceptedDeviceModelIdsExcluding,
  createIntent,
  type DeviceConnectionParams,
} from "@features/platform-device-intent";
import type {
  VerifyAddressIntent,
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-intent-verify-address";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Account } from "@ledgerhq/types-live";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import { useStore } from "~/context/hooks";
import type { State } from "~/reducers/types";
import { accountsSelector } from "~/reducers/accounts";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWMDefinition } from "./intentLWMDefinition";

const { selectAccountEntry } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** `getAddress` options and the wrong-device check still read the legacy account. */
function selectLegacyAccount(state: State, accountUUID: AccountUUID): Account | undefined {
  const legacyId = selectAccountEntry(state, accountUUID)?.legacyId;
  return legacyId === undefined
    ? undefined
    : accountsSelector(state).find(account => account.id === legacyId);
}

type PreparedVerification = Readonly<{
  deviceInitializationInput: InitializationInput;
  intent: VerifyAddressIntent;
  tracking: VerifyAddressTracking;
}>;

async function prepareVerification(
  account: Account,
  assetId: string,
  intentInput: VerifyAddressIntentInput,
): Promise<PreparedVerification> {
  const tokenCurrency =
    assetId === account.currency.id
      ? undefined
      : await getCryptoAssetsStore().findTokenById(assetId);
  const deviceInitializationInput = await buildDeviceInitializationInput({
    appRequest: { account, tokenCurrency },
    flow: FlowName.receive,
  });

  return {
    deviceInitializationInput,
    intent: createIntent(verifyAddressIntentLWMDefinition, intentInput),
    tracking: { asset: (tokenCurrency ?? account.currency).ticker, network: account.currency.id },
  };
}

type Props = Readonly<{
  selection: VerifyAddressSelection;
  onExit: (outcome: VerifyAddressOutcome) => void;
  unsupportedDeviceModelIds?: readonly DeviceModelId[];
}>;

export function VerifyAddressExecutorLWM({
  selection,
  onExit,
  unsupportedDeviceModelIds,
}: Props): React.ReactElement | null {
  const { accountUUID, assetId, verification } = selection;
  const store = useStore();
  const [prepared, setPrepared] = useState<PreparedVerification | null>(null);
  const { exit, onJobStateChanged, onUserCancel } = useVerifyAddressSession({
    tracking: prepared?.tracking,
    onExit,
  });

  const deviceConnectionParams = useMemo<DeviceConnectionParams>(
    () => ({ acceptedDeviceModelIds: acceptedDeviceModelIdsExcluding(unsupportedDeviceModelIds) }),
    [unsupportedDeviceModelIds],
  );

  useEffect(() => {
    const account = selectLegacyAccount(store.getState(), accountUUID);
    if (!account) {
      exit("initFailed");
      return;
    }
    const intentInput = buildVerifyAddressIntentInput(account, verification);
    if (!intentInput) {
      exit("unsupported");
      return;
    }

    let unmounted = false;
    prepareVerification(account, assetId, intentInput).then(
      next => {
        if (!unmounted) setPrepared(next);
      },
      () => {
        if (!unmounted) exit("initFailed");
      },
    );
    return () => {
      unmounted = true;
    };
  }, [accountUUID, assetId, verification, store, exit]);

  if (!prepared) return null;

  return (
    <DeviceIntentExecutor<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      enabled
      sourceFlow="receive"
      deviceConnectionParams={deviceConnectionParams}
      deviceInitializationInput={prepared.deviceInitializationInput}
      intent={prepared.intent}
      intentComponentExtraProps={undefined}
      onIntentJobStateChanged={onJobStateChanged}
      onUserCancel={onUserCancel}
    />
  );
}
