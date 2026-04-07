import { useEffect } from "react";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import type { Account } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
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
  useEffect(() => {
    if (!device) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sub: any;
    let cancelled = false;

    getAccountBridge(account).then(bridge => {
      if (cancelled) return;
      sub = bridge
        .receive(account, {
          deviceId: device.deviceId,
          verify: true,
        })
        .subscribe({
          complete() {
            onResult(true);
          },
          error(err) {
            onResult(false, err as Error);
          },
        });
    });

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [account, device, onResult]);

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
