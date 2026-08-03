import fs from "fs";
import invariant from "invariant";
import {
  encodeAccountId,
  decodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { DmkSignerAleo } from "@ledgerhq/live-signer-aleo";
import { getEnv } from "@shared/env";
import type { AccountRaw } from "@ledgerhq/types-live";
import { getSendEvents, shareViewKey } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { Transaction } from "../models/Transaction";
import { Account } from "../enum/Account";
import { withDeviceController } from "../deviceInteraction/DeviceController";

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

async function fetchViewKey(path: string): Promise<string> {
  const transport = await DeviceManagementKitTransportSpeculos.open({
    apiPort: String(getEnv("SPECULOS_API_PORT")),
  });

  try {
    const signer = new DmkSignerAleo(transport.dmk, transport.sessionId);
    const [{ viewKey }] = await Promise.all([signer.getViewKey(path), shareViewKey()]);
    return viewKey;
  } finally {
    // transport.close() keeps the session in the static `byBase` cache; a same-port relaunch would reuse it.
    await DeviceManagementKitTransportSpeculos.disconnectAll();
  }
}

/**
 * Aleo accounts need a view key in the account id (`customData`) — `extractViewKey` throws
 * without it, on sync as well as signing. `liveData` cannot produce it; in the app it comes
 * from a device confirmation, so this reads it from Speculos and re-encodes the seeded id.
 */
export const shareViewKeyCommand = (account: Account) => async (userdataPath?: string) => {
  invariant(userdataPath, "aleo: shareViewKeyCommand requires a userdataPath");

  const viewKey = await fetchViewKey(account.accountPath);

  const raw = fs.readFileSync(userdataPath, "utf-8");
  const accounts = JSON.parse(raw).data?.accounts;
  invariant(Array.isArray(accounts), "aleo: no decrypted accounts array in %s", userdataPath);
  const entry = accounts.find((e: { data: AccountRaw }) => {
    return (
      e.data.currencyId === account.currency.id && e.data.freshAddressPath === account.accountPath
    );
  });
  invariant(
    entry,
    `aleo: no ${account.currency.id} account at ${account.accountPath} in ${userdataPath}`,
  );

  // operation and sub-account ids embed the account id, so replace it as text everywhere
  const newId = encodeAccountId({ ...decodeAccountId(entry.data.id), customData: viewKey });
  fs.writeFileSync(userdataPath, raw.replaceAll(entry.data.id, newId), "utf-8");
};
