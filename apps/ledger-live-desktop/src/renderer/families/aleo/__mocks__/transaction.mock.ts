import BigNumber from "bignumber.js";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";

export const ALEO_RECIPIENT_ADDRESS =
  "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

export const makeAleoTransaction = (overrides?: Partial<AleoTransaction>): AleoTransaction => ({
  family: "aleo",
  mode: "transfer_public",
  recipient: "",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  useAllAmount: false,
  ...overrides,
});
