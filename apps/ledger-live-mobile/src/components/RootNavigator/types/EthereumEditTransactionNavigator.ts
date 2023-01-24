import { AccountLike, Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type EthereumEditTransactionParamList = {
  [ScreenName.EditTransactionOptions]: {
    operation: Operation;
    account: AccountLike;
  };
  [ScreenName.CancelTransaction]: {
    operation: Operation;
    account: AccountLike;
  };
  [ScreenName.SpeedUpTransaction]: {
    operation: Operation;
    account: AccountLike;
  };
};
