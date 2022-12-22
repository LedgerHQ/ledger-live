import { ZilliqaAccount } from "./types";

export const getNonce = (a: ZilliqaAccount): number => {
    console.log("ZILLIQA: getNonce.");
    return a.zilliqaResources ? a.zilliqaResources.nonce : 1;
};
