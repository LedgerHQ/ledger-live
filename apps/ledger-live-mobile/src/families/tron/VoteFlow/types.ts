import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/tron/types";
import { ScreenName } from "../../../const";

export type TronVoteFlowParamList = {
  [ScreenName.VoteSelectValidator]: {
    accountId: string;
    parentId?: string;
    transaction?: Transaction;
    status?: TransactionStatus;
    fromStep2?: boolean;
  };
};
