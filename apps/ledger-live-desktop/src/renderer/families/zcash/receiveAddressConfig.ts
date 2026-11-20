import { isZcashCurrencyId } from "@ledgerhq/live-common/bridge/zcashRouting";
import type { GetReceiveFamilyConfig, ReceiveNoticeId } from "@features/flow-receive";

export const receiveAddressConfig: GetReceiveFamilyConfig = ({ asset, featureFlags, receive }) => {
  const notices: ReceiveNoticeId[] = ["utxo"];

  const isShieldedZcash = !!featureFlags.zcashShielded?.enabled && isZcashCurrencyId(asset.id);
  const hasNoShieldedAddress = receive !== undefined && receive.shielded === undefined;
  if (isShieldedZcash && hasNoShieldedAddress) notices.push("zcashPrivateNotEnabled");

  return { notices };
};
