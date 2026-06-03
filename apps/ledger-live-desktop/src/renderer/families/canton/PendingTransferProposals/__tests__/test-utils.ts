/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import type { ProcessedProposal, RawTransferProposal } from "../types";
export { createMockAccount } from "../../__tests__/testUtils";

export const ACCOUNT_XPUB = "test-xpub";
export const MOCK_UNIT: Unit = { name: "Amulet", code: "CC", magnitude: 10 };

export const createRawProposal = (
  contractId: string,
  sender: string,
  receiver: string,
  overrides: Partial<RawTransferProposal> = {},
): RawTransferProposal => ({
  contract_id: contractId,
  sender,
  receiver,
  amount: "1000000",
  instrument_id: "instrument-1",
  instrument_admin: "",
  update_id: "",
  expires_at_micros: Date.now() * 1000 + 3600000000,
  memo: "",
  ...overrides,
});

export const createProcessedProposal = (
  overrides: Partial<ProcessedProposal> = {},
): ProcessedProposal => {
  const futureMicros = (Date.now() + 3600000) * 1000;
  const expiresAt = new Date(futureMicros / 1000);
  const day = new Date(expiresAt);
  day.setUTCHours(0, 0, 0, 0);
  return {
    contractId: "contract-1",
    sender: "sender-xpub",
    receiver: ACCOUNT_XPUB,
    amount: new BigNumber("1000000"),
    instrumentId: "instrument-1",
    unit: MOCK_UNIT,
    memo: "",
    expiresAtMicros: futureMicros,
    isExpired: false,
    isIncoming: true,
    expiresAt,
    day,
    ...overrides,
  };
};
