import type { GetReceiveFamilyConfig } from "@features/flow-receive";

const receiveAddressConfig: GetReceiveFamilyConfig = ({ asset, accountStatus }) => {
  const receivesNativeAsset = asset.type === "CryptoCurrency";
  const isInactiveAccount = accountStatus?.used === false;
  return receivesNativeAsset && isInactiveAccount ? { notices: ["tronInactiveAccount"] } : {};
};

export default receiveAddressConfig;
