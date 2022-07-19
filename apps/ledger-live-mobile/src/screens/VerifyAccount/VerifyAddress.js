// @flow

import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import type { Account } from "@ledgerhq/live-common/types/account";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/helpers";

import { renderVerifyAddress } from "../../components/DeviceAction/rendering";

function VerifyAddress({
  account,
  device,
  onResult,
}: {
  account: Account,
  device: ?Device,
  onResult: (confirmed: boolean, error?: Error) => void,
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const onConfirmAddress = useCallback(async () => {
    try {
      if (!device) return;
      await getAccountBridge(account)
        .receive(account, {
          deviceId: device.deviceId,
          verify: true,
        })
        .toPromise();
      onResult(true);
    } catch (err) {
      onResult(false, err);
    }
  }, [account, device, onResult]);

  useEffect(() => {
    onConfirmAddress();
  }, [onConfirmAddress]);

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
