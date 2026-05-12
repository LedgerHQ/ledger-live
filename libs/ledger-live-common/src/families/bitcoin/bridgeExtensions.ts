import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "@ledgerhq/coin-bitcoin/operation";
import type { AccountBridgeExtensions, Account, AccountLike } from "@ledgerhq/types-live";
import { defaultClearAccount } from "../../bridge/defaultBridgeExtensions";
import { clearAccount as bitcoinClearAccount } from "./clearAccount";

const extensions: AccountBridgeExtensions = {
  clearAccount: <A extends AccountLike>(account: A): A =>
    defaultClearAccount(account, bitcoinClearAccount as (account: Account) => void),
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
};

export default extensions;
