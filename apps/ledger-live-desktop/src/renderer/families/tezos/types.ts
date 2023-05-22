import { TezosAccount, Transaction, TransactionStatus } from "@ledgerhq/live-common/families/tezos/types";
import { ModalsData } from "./modals";

import { FieldComponentProps, LLDCoinFamily } from "../types";

export type TezosFamily = LLDCoinFamily<TezosAccount, Transaction, TransactionStatus, ModalsData>;
export type TezosFieldComponentProps = FieldComponentProps<TezosAccount, Transaction, TransactionStatus>