import type { MockReaders } from "../families/types";
import { balance } from "./balance";

/** The generic reader of each kind, for the families that do not answer it their own way. */
export const kinds: MockReaders = { balance };
