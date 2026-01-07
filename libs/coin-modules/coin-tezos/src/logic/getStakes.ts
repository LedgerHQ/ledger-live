import type { Cursor, Page, Stake } from "@ledgerhq/coin-framework/api/types";
import api from "../network/tzkt";

export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  // tezos exposes a single staking position via delegation when a delegate is set
  const accountInfo = await api.getAccountByAddress(address);
  if (accountInfo.type !== "user" || !accountInfo.delegate?.address) return { items: [] };
  return {
    items: [
      {
        uid: address,
        address,
        delegate: accountInfo.delegate.address,
        state: "active",
        asset: { type: "native" },
        amount: BigInt(accountInfo.balance ?? 0),
      },
    ],
  };
}
