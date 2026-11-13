import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";
import type { GetReceiveFamilyConfig, ReceiveNoticeId } from "@features/flow-receive";

const TAPROOT_PATH_PREFIX = "m/86h/";

export const receiveAddressConfig: GetReceiveFamilyConfig = ({
  descriptor,
  asset,
  featureFlags,
  receive,
}) => {
  const notices: ReceiveNoticeId[] = ["utxo"];
  if (descriptor.path.startsWith(TAPROOT_PATH_PREFIX)) notices.push("taproot");
  if (asset.id === "dash") notices.push("dashStaking");

  const isShieldedZcash = !!featureFlags.zcashShielded?.enabled && isZcashCurrencyId(asset.id);
  const hasNoShieldedAddress = receive !== undefined && receive.shielded === undefined;
  if (isShieldedZcash && hasNoShieldedAddress) notices.push("zcashPrivateNotEnabled");

  return { notices };
};
