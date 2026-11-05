import type { MockReaders } from "../families/types";
import { address } from "./address";
import { balance } from "./balance";
import { balanceHistory } from "./balanceHistory";
import { operations } from "./operations";

/** The generic reader of each kind, for the families that do not answer it their own way. */
export const kinds: MockReaders = { address, balance, operations, balanceHistory };
