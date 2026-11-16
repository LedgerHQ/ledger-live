import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockSwapHistoryEntry } from "@domain/entity-swap-history/schema.mock";
import History from "./History";

const ethereum = getCryptoCurrencyById("ethereum");
const sender = genAccount("history-sender", { operationsSize: 1, currency: ethereum });
const receiver = genAccount("history-receiver", { operationsSize: 0, currency: ethereum });
const senderDescriptor = mockAddressAccountDescriptor({ key: "0x01" });
const receiverDescriptor = mockAddressAccountDescriptor({ key: "0x02" });
const senderUUID = computeAccountUUID(senderDescriptor);
const receiverUUID = computeAccountUUID(receiverDescriptor);

const accountEntries = accountsSlice.reducer(
  undefined,
  legacyAccountsSynced([
    LegacyAccountEntrySchema.parse(
      mockAccountEntry({
        descriptor: senderDescriptor,
        legacyId: AccountIdSchema.parse(sender.id),
      }),
    ),
    LegacyAccountEntrySchema.parse(
      mockAccountEntry({
        descriptor: receiverDescriptor,
        legacyId: AccountIdSchema.parse(receiver.id),
      }),
    ),
  ]),
);

const entry = mockSwapHistoryEntry({
  swapId: "entity-swap",
  status: "finished",
  accountUUID: senderUUID,
  assetId: "ethereum",
  toAccountUUID: receiverUUID,
  toAssetId: "ethereum",
  operationId: sender.operations[0].id,
});

describe("Swap History", () => {
  it("lists the swaps of the swap history entity", async () => {
    render(<History />, {
      initialState: {
        accounts: [{ ...sender, swapHistory: [] }, receiver],
        accountEntries,
        swapHistory: { [senderUUID]: [entry] },
      },
    });

    expect(await screen.findByTestId("operation-row-entity-swap")).toBeVisible();
  });

  it("does not list a swap only the legacy account holds", async () => {
    const legacyOnly = {
      provider: "changelly",
      swapId: "legacy-swap",
      status: "finished",
      receiverAccountId: receiver.id,
      operationId: sender.operations[0].id,
      fromAmount: new BigNumber(1),
      toAmount: new BigNumber(1),
    };
    render(<History />, {
      initialState: {
        accounts: [{ ...sender, swapHistory: [legacyOnly] }, receiver],
        accountEntries,
        swapHistory: {},
      },
    });

    expect(await screen.findByText("Your previous swaps will appear here")).toBeVisible();
    expect(screen.queryByTestId("operation-row-legacy-swap")).toBeNull();
  });
});
