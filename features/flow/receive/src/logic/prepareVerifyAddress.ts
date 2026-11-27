import {
  acceptedDeviceModelIdsExcluding,
  createIntent,
  NoAcceptedDeviceModelError,
  type DeviceConnectionParams,
} from "@features/platform-device-intent";
import {
  verifyAddressIntentDefinitionWithResult,
  type VerifyAddressIntent,
  type VerifyAddressIntentResult,
} from "@features/platform-intent-verify-address";
import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  VerifyAddressAccount,
  VerifyAddressExecutorPorts,
  VerifyAddressSelection,
  VerifyAddressTracking,
} from "../types";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { canVerifyOnDevice } from "./canVerifyOnDevice";

export type PreparedVerifyAddress<InitInput> = Readonly<{
  deviceConnectionParams: DeviceConnectionParams;
  deviceInitializationInput: InitInput;
  intent: VerifyAddressIntent<undefined, VerifyAddressIntentResult>;
  tracking: VerifyAddressTracking;
}>;

export type VerifyAddressPreparation<InitInput> =
  | Readonly<{ type: "ready"; prepared: PreparedVerifyAddress<InitInput> }>
  | Readonly<{
      type: "exit";
      outcome: "unsupported" | "failed";
      tracking?: VerifyAddressTracking;
    }>;

export type VerifyAddressAttemptListeners = Readonly<{
  onResult: (result: VerifyAddressIntentResult) => void;
  onAttemptStart: () => void;
  onAddressDisplayed: () => void;
}>;

function acceptedDeviceModelIdsOrNone(
  unsupportedDeviceModelIds: readonly DeviceModelId[] | undefined,
): DeviceConnectionParams["acceptedDeviceModelIds"] | undefined {
  try {
    return acceptedDeviceModelIdsExcluding(unsupportedDeviceModelIds);
  } catch (error) {
    if (error instanceof NoAcceptedDeviceModelError) return undefined;
    throw error;
  }
}

/** Everything the executor needs, or the outcome that ends the verification before the device. */
export async function prepareVerifyAddress<
  Account extends VerifyAddressAccount,
  Token extends { ticker: string },
  Options,
  InitInput,
>(
  account: Account,
  { assetId, verification }: VerifyAddressSelection,
  unsupportedDeviceModelIds: readonly DeviceModelId[] | undefined,
  { onResult, onAttemptStart, onAddressDisplayed }: VerifyAddressAttemptListeners,
  ports: VerifyAddressExecutorPorts<Account, Token, Options, InitInput>,
): Promise<VerifyAddressPreparation<InitInput>> {
  const isToken = assetId !== account.currency.id;
  const tokenCurrency = isToken ? await ports.findToken(assetId) : undefined;
  if (isToken && !tokenCurrency) return { type: "exit", outcome: "failed" };

  const tracking = {
    asset: (tokenCurrency ?? account.currency).ticker,
    network: account.currency.id,
  };
  const intentInput = buildVerifyAddressIntentInput(account, verification, ports, {
    onAttemptStart,
    onAddressDisplayed,
  });
  const acceptedDeviceModelIds = acceptedDeviceModelIdsOrNone(unsupportedDeviceModelIds);
  if (!intentInput || !acceptedDeviceModelIds || !canVerifyOnDevice(verification)) {
    return { type: "exit", outcome: "unsupported", tracking };
  }

  const deviceInitializationInput = await ports.buildInitializationInput({
    account,
    tokenCurrency,
    verification,
  });
  const definition = {
    ...verifyAddressIntentDefinitionWithResult,
    component: ports.intentComponent,
  };

  return {
    type: "ready",
    prepared: {
      deviceConnectionParams: { acceptedDeviceModelIds },
      deviceInitializationInput,
      intent: createIntent(definition, intentInput, { onResult }),
      tracking,
    },
  };
}
