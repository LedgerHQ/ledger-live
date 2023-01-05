import { ZilliqaAccount } from "./types";

export const getNonce = (a: ZilliqaAccount): number => {
  return a.zilliqaResources ? a.zilliqaResources.nonce : 1;
};
