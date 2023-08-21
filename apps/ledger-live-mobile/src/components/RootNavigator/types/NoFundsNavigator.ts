import { Account } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type NoFundsNavigatorParamList = {
  [ScreenName.NoFunds]: {
    account: Account;
    parentAccount?: Account;
  };
};
