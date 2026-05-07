import { useEffect } from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import type { Account } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import { renderVerifyAddress } from "~/components/DeviceAction/rendering";

function VerifyAddress({
  account,
  device,
  onResult,
}: {
  account: Account;
  device: Device | null | undefined;
  onResult: (confirmed: boolean, error?: Error) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const bridge = useAccountBridge(account);
  useEffect(() => {
    if (!device) return;

    const sub = bridge
      .receive(account, {
        deviceId: device.deviceId,
        verify: true,
      })
      .subscribe({
        complete() {
          onResult(true);
        },
        error(err: Error) {
          onResult(false, err);
        },
      });

    return () => {
      sub.unsubscribe();
    };
  }, [account, bridge, device, onResult]);

  if (!device) return null;

  return renderVerifyAddress({
    t,
    currencyName: getAccountCurrency(account).name,
    device,
    address: account.freshAddress,
    theme,
  });
}

export default VerifyAddress;
