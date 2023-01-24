import { Operation } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type EthereumEditTransactionParamList = {
  [ScreenName.EditTransactionOptions]: {
    operation: Operation;
  };
  [ScreenName.CancelTransaction]: {
    operation: Operation;
  };
  [ScreenName.SpeedUpTransaction]: {
    operation: Operation;
  };
};
