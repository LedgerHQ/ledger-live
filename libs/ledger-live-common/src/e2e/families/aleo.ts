import fs from "fs";
import {
  encodeAccountId,
  decodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { encodeOperationId, decodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AccountRaw, OperationRaw } from "@ledgerhq/types-live";
import { getSendEvents, pressUntilTextFound } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease, pressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";
import { withDeviceController } from "../deviceInteraction/DeviceController";
import { runCliLiveData, runCliGetViewKey } from "../runCli";
import { getAccountAddress } from "../cliCommandsUtils";

export const sendAleo = withDeviceController(
  ({ getButtonsController }) =>
    async (tx: Transaction) => {
      const buttons = getButtonsController();

      await getSendEvents(tx);
      if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
      } else {
        await buttons.both();
      }
    },
);

export const shareViewKey = withDeviceController(({ getButtonsController }) => async () => {
  const buttons = getButtonsController();

  await pressUntilTextFound(DeviceLabels.CONFIRM);

  if (isTouchDevice()) {
    await pressAndRelease(DeviceLabels.CONFIRM);
  } else {
    await buttons.both();
  }
});

export function patchAccountRawWithViewKey(raw: AccountRaw, viewKey: string): AccountRaw {
  const oldId = raw.id;
  const newId = encodeAccountId({ ...decodeAccountId(oldId), customData: viewKey });

  const patchOps = (ops: OperationRaw[]): OperationRaw[] =>
    ops.map(op => {
      const { hash, type } = decodeOperationId(op.id);

      return {
        ...op,
        accountId: newId,
        id: encodeOperationId(newId, hash, type),
      };
    });

  return {
    ...raw,
    id: newId,
    operations: patchOps(raw.operations),
    pendingOperations: patchOps(raw.pendingOperations),
  };
}

export const liveDataWithRecipientAddressCommand =
  (tx: Transaction) =>
  async (userdataPath?: string): Promise<string> => {
    if (!userdataPath) {
      throw new Error("userdataPath is required for Aleo liveDataWithRecipientAddressCommand");
    }

    await runCliLiveData({
      currency: tx.accountToDebit.currency.speculosApp.name,
      index: tx.accountToDebit.index,
      add: true,
      appjson: userdataPath,
    });

    const address = await getAccountAddress(tx.accountToCredit);
    tx.accountToCredit.address = address;
    tx.recipientAddress = address;

    // get view key from speculos (CLI sends the APDU and blocks, shareViewKey() polls)
    const [{ viewKey }] = await Promise.all([
      runCliGetViewKey({
        currency: tx.accountToDebit.currency.speculosApp.name,
        path: tx.accountToDebit.accountPath,
      }),
      shareViewKey(),
    ]);

    // patch app.json with view key at AccountRaw level to avoid bridge setup
    const appJson = JSON.parse(fs.readFileSync(userdataPath, "utf-8"));
    appJson.data.accounts = appJson.data.accounts.map(
      (entry: { data: AccountRaw; version: number }) => {
        if (entry.data.currencyId !== tx.accountToDebit.currency.id) {
          return entry;
        }

        return {
          ...entry,
          data: patchAccountRawWithViewKey(entry.data, viewKey),
        };
      },
    );
    fs.writeFileSync(userdataPath, JSON.stringify(appJson));

    return address;
  };
