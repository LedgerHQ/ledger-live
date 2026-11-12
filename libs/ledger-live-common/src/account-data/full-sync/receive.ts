import type { Account } from "@ledgerhq/types-live";
import {
  ReceiveMemoSchema,
  type AccountReceive,
  type ReceiveAddress,
} from "@domain/entity-account-receive";
import { defaultAccountReceive } from "../../account/accountReceive";
import { getSendDescriptor } from "../../bridge/descriptor/registry";
import { resolveFamily } from "../../bridge/zcashRouting";
import { loadAccountReceiveForFamily } from "../../coin-modules/registry";

/** `address` with the memo a sender can attach to it, as the coin's send descriptor declares it. */
function withMemo<T extends ReceiveAddress>(account: Account, address: T): T {
  const input = getSendDescriptor(account.currency)?.inputs.memo;
  if (!input || !(input.appliesToRecipient?.(address.address) ?? true)) return address;
  // A `number` input is no memo kind a sender is told about.
  const memo = ReceiveMemoSchema.safeParse({
    type: input.type,
    maxLength: input.maxLength,
    maxValue: input.maxValue?.toString(),
    options: input.options,
    defaultOption: input.defaultOption,
  });
  return memo.success ? { ...address, memo: memo.data } : address;
}

/** The `receive` kind of a synced account: its family's own rule if it has one, else the default. */
export async function toAccountReceive(account: Account): Promise<AccountReceive> {
  const familyReceive = await loadAccountReceiveForFamily(resolveFamily(account.currency));
  const receive = withMemo(account, (familyReceive ?? defaultAccountReceive)(account));
  return receive.shielded ? { ...receive, shielded: withMemo(account, receive.shielded) } : receive;
}
