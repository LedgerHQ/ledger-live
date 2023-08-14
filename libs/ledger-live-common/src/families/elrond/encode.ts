import { SubAccount } from "@ledgerhq/types-live";
import { decodeTokenAccountId } from "../../account";
import type { Transaction } from "./types";
import { extractTokenId } from "./logic";

export class ElrondEncodeTransaction {
  static ESDTTransfer(t: Transaction, ta: SubAccount): string {
    const { token } = decodeTokenAccountId(ta.id);
    const tokenIdentifierHex = token && extractTokenId(token.id);
    let amountHex = t.useAllAmount ? ta.balance.toString(16) : t.amount.toString(16);

    //hex amount length must be even so protocol would treat it as an ESDT transfer
    if (amountHex.length % 2 !== 0) {
      amountHex = "0" + amountHex;
    }

    return Buffer.from(`ESDTTransfer@${tokenIdentifierHex}@${amountHex}`).toString("base64");
  }

  static delegate(): string {
    return Buffer.from(`delegate`).toString("base64");
  }

  static claimRewards(): string {
    return Buffer.from(`claimRewards`).toString("base64");
  }

  static withdraw(): string {
    return Buffer.from(`withdraw`).toString("base64");
  }

  static reDelegateRewards(): string {
    return Buffer.from(`reDelegateRewards`).toString("base64");
  }

  static unDelegate(t: Transaction): string {
    let amountHex = t.amount.toString(16);

    //hex amount length must be even
    if (amountHex.length % 2 !== 0) {
      amountHex = "0" + amountHex;
    }

    return Buffer.from(`unDelegate@${amountHex}`).toString("base64");
  }
}
