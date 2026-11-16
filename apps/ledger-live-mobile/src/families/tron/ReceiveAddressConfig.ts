import type { Account } from "@ledgerhq/types-live";
import type { GetReceiveFamilyConfig } from "@features/flow-receive";

const receiveAddressConfig: GetReceiveFamilyConfig<Account> = ({ asset, legacyAccount }) => {
  const receivesNativeAsset = asset.type === "CryptoCurrency";
  const isInactiveAccount = legacyAccount?.operationsCount === 0;
  return receivesNativeAsset && isInactiveAccount ? { notices: ["tronInactiveAccount"] } : {};
};

export default receiveAddressConfig;
