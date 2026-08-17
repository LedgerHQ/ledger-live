import React from "react";
import { Trans } from "react-i18next";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useFeature } from "@features/platform-feature-flags";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import type { StepProps } from "~/renderer/modals/Receive/Body";

type Props = StepProps & { fallback: React.ReactNode };

const ZcashReceiveDeviceAnimation = ({ account, parentAccount, device, fallback }: Props) => {
  const type = useTheme().theme;
  const shieldedEnabled = useFeature("zcashShielded")?.enabled ?? false;

  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const privateInfo = (mainAccount as ZcashAccount | null)?.privateInfo as
    | ZcashPrivateInfo
    | undefined;
  const shieldedAddress =
    shieldedEnabled && mainAccount?.currency.id === "zcash"
      ? (privateInfo?.shieldedAddress ?? null)
      : null;

  // Without a shielded address the account still confirms its transparent
  // address through the standard path, so the standard animation applies.
  if (!shieldedAddress || !device) return <>{fallback}</>;

  return (
    <>
      <Box horizontal alignItems="center" flow={2} data-testid="zcash-receive-device-animation">
        <Text style={{ flexShrink: "unset" }} ff="Inter|SemiBold" color="neutral.c100" fontSize={4}>
          <Trans i18nKey="zcash.shielded.receive.verifyAddresses" />
        </Text>
      </Box>
      {renderVerifyUnwrapped({ modelId: device.modelId, type })}
    </>
  );
};

export default ZcashReceiveDeviceAnimation;
