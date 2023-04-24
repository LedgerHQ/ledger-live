import { ZilliqaAccount } from "./types";
import { getAccount } from "./api";

export const getNonce = async (a: ZilliqaAccount): Promise<number> => {
  return a.zilliqaResources
    ? a.zilliqaResources.nonce
    : (await getAccount(a.freshAddress)).nonce;
};
