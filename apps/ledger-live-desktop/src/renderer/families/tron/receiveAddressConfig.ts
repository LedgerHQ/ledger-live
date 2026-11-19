import type { GetReceiveFamilyConfig } from "@features/flow-receive";

export const receiveAddressConfig: GetReceiveFamilyConfig = ({ accountStatus }) => {
  const isInactiveAccount = accountStatus?.used === false;
  return isInactiveAccount ? { notices: ["tronInactiveAccount"] } : {};
};
