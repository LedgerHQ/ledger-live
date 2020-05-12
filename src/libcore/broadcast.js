// @flow

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

export type Arg = {
  broadcast: ({
    account: Account,
    coreAccount: CoreAccount,
    signedOperation: SignedOperation,
  }) => Promise<Operation>,
};

type Broadcast<T> = $PropertyType<AccountBridge<T>, "broadcast">;

export const makeBroadcast = ({ broadcast }: Arg): Broadcast<any> => ({
  account,
  signedOperation,
}) =>
  withLibcore(async (core) => {
    const { coreAccount } = await getCoreAccount(core, account);
    const res = await broadcast({ account, coreAccount, signedOperation });
    return res;
  }).catch((e) => Promise.reject(remapLibcoreErrors(e)));
