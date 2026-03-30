import { z } from "zod";
import { flagWithRecord } from "../../define";

export const stakeAccountBanner = flagWithRecord(z.record(z.string(), z.unknown()));
