import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

import { BLUETOOTH_STATUS_MESSAGE_KEYS } from "~/renderer/components/Bluetooth/useConnectBluetooth";
import type { ConnectionBluetoothViewModel } from "../useConnectionViewModel";

type ConnectBluetoothActionProps = {
  bluetooth: ConnectionBluetoothViewModel;
};

export function ConnectBluetoothAction({
  bluetooth,
}: Readonly<ConnectBluetoothActionProps>): React.ReactNode {
  const { t } = useTranslation();
  const isSearching = bluetooth.status === "searching";
  const messageKey = BLUETOOTH_STATUS_MESSAGE_KEYS[bluetooth.status];

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <Button
        appearance="gray"
        size="lg"
        className="w-full"
        loading={isSearching}
        disabled={isSearching}
        onClick={bluetooth.onConnect}
      >
        {t("bluetooth.connect.cta")}
      </Button>
      {messageKey ? <p className="body-2 text-center text-muted">{t(messageKey)}</p> : null}
    </div>
  );
}
