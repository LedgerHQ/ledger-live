import type {
  AccountBridge,
  Operation,
  Account,
  SignedOperation,
} from "../types";
import type { CoreAccount } from "./types";
import { withLibcore } from "./access";
import { remapLibcoreErrors } from "./errors";
import { getCoreAccount } from "./getCoreAccount";
import { Transaction } from "../types";

export type Arg = {
  broadcast: (arg0: {
    account: Account;
    coreAccount: CoreAccount;
    signedOperation: SignedOperation;
  }) => Promise<Operation>;
};

type Broadcast = AccountBridge<Transaction>["broadcast"];

export const makeBroadcast =
  ({ broadcast }: Arg): Broadcast =>
  ({ account, signedOperation }) =>
    withLibcore(async (core) => {
      const { coreAccount } = await getCoreAccount(core, account);
      const res = await broadcast({
        account,
        coreAccount,
        signedOperation,
      });
      return res;
    }).catch((e) => Promise.reject(remapLibcoreErrors(e)));
