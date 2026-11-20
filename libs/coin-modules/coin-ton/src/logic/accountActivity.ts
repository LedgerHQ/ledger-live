import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { Address } from "@ton/core";
import type { TonJettonTransfer, TonTransaction } from "../network/types";
import { addressesAreEqual } from "./address";

const nonBounceable = (rawAddress: string): string =>
  Address.parse(rawAddress).toString({ urlSafe: true, bounceable: false });

export function transactionTransfers(
  address: string,
  tx: TonTransaction,
): { accountAddress: string; isReceiving: boolean; outMessages: TonTransaction["out_msgs"] } {
  const accountAddress = nonBounceable(tx.account);
  if (accountAddress !== address)
    throw new Error(`[ton] unexpected address ${accountAddress} ${address}`);

  const isReceiving = !!(
    tx.in_msg?.source &&
    tx.in_msg.value &&
    tx.in_msg.value !== "0" &&
    tx.account === tx.in_msg.destination
  );
  // A wallet v4/v5 batch can emit several value-bearing messages: all of them make one OUT.
  const outMessages = tx.out_msgs.filter(
    msg => msg.source && msg.value && msg.value !== "0" && tx.account === msg.source,
  );
  return { accountAddress, isReceiving, outMessages };
}

export function yieldsOperation(address: string, tx: TonTransaction): boolean {
  const { isReceiving, outMessages } = transactionTransfers(address, tx);
  return isReceiving || outMessages.length > 0;
}

export async function jettonTransferOf(
  address: string,
  transfer: TonJettonTransfer,
  currencyId: string,
): Promise<{ token: TokenCurrency; isReceiving: boolean; isSending: boolean } | undefined> {
  if (nonBounceable(address) !== address)
    throw new Error(`[ton] unexpected address ${nonBounceable(address)} ${address}`);

  const jettonMaster = Address.parse(transfer.jetton_master).toString({
    urlSafe: true,
    bounceable: true,
  });
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
    jettonMaster.toLowerCase(),
    currencyId,
  );
  if (!token) return undefined;

  const isReceiving = addressesAreEqual(address, nonBounceable(transfer.destination));
  const isSending = addressesAreEqual(address, nonBounceable(transfer.source));
  if (!isSending && !isReceiving) throw new Error("[ton] unexpected addresses");
  return { token, isReceiving, isSending };
}

export function yieldsSubAccount(
  token: TokenCurrency | undefined,
  blacklistedTokenIds: readonly string[],
): token is TokenCurrency {
  return !!token && !blacklistedTokenIds.includes(token.id);
}
