import type { AccountLike } from "@ledgerhq/types-live";

import { getWalletApiIdFromAccountId, setWalletApiIdForAccountId } from "../../converters";
import { resolveQuotesInput } from "./resolveQuotesInput";

function registerWalletApiAccount(realId: string): string {
  setWalletApiIdForAccountId(realId);
  return getWalletApiIdFromAccountId(realId);
}

function makeAccount(id: string, currencyId: string, freshAddress: string): AccountLike {
  return {
    type: "Account",
    id,
    currency: { id: currencyId },
    freshAddress,
  } as unknown as AccountLike;
}

function makeTokenAccount(id: string, parentId: string, tokenId: string): AccountLike {
  return {
    type: "TokenAccount",
    id,
    parentId,
    token: { id: tokenId },
  } as unknown as AccountLike;
}

describe("resolveQuotesInput", () => {
  it("derives currencies, addresses, and fee currency from main accounts", () => {
    const sendAccountId = registerWalletApiAccount("ethereum-account");
    const receiveAccountId = registerWalletApiAccount("bitcoin-account");

    const resolved = resolveQuotesInput(
      {
        amount: "1",
        sendAccountId,
        receiveAccountId,
      },
      [
        makeAccount("ethereum-account", "ethereum", "0xsend"),
        makeAccount("bitcoin-account", "bitcoin", "bc1receive"),
      ],
    );

    expect(resolved).toMatchObject({
      amount: "1",
      sendAccountId,
      receiveAccountId,
      sendCurrencyId: "ethereum",
      receiveCurrencyId: "bitcoin",
      sendAddress: "0xsend",
      receiveAddress: "bc1receive",
      networkFeesCurrencyId: "ethereum",
    });
  });

  it("uses token currency ids and parent account addresses for token accounts", () => {
    const sendAccountId = registerWalletApiAccount("usdc-account");
    const receiveAccountId = registerWalletApiAccount("usdt-account");

    const resolved = resolveQuotesInput(
      {
        amount: "25",
        sendAccountId,
        receiveAccountId,
      },
      [
        makeAccount("ethereum-account", "ethereum", "0xsend-parent"),
        makeTokenAccount("usdc-account", "ethereum-account", "ethereum/erc20/usd__coin"),
        makeAccount("polygon-account", "polygon", "0xreceive-parent"),
        makeTokenAccount("usdt-account", "polygon-account", "polygon/erc20/usd_tether"),
      ],
    );

    expect(resolved).toMatchObject({
      sendCurrencyId: "ethereum/erc20/usd__coin",
      receiveCurrencyId: "polygon/erc20/usd_tether",
      sendAddress: "0xsend-parent",
      receiveAddress: "0xreceive-parent",
      networkFeesCurrencyId: "ethereum",
    });
  });

  it("keeps explicit fallback fields when accounts are not available", () => {
    const resolved = resolveQuotesInput(
      {
        amount: "1",
        sendAccountId: "",
        receiveAccountId: "",
        sendCurrencyId: "bitcoin",
        receiveCurrencyId: "ethereum",
        sendAddress: "bc1send",
        receiveAddress: "0xreceive",
      },
      [],
    );

    expect(resolved).toMatchObject({
      sendCurrencyId: "bitcoin",
      receiveCurrencyId: "ethereum",
      sendAddress: "bc1send",
      receiveAddress: "0xreceive",
    });
  });

  it("returns undefined when neither accounts nor explicit fallback fields can resolve the request", () => {
    expect(
      resolveQuotesInput(
        {
          amount: "1",
          sendAccountId: "unknown-send",
          receiveAccountId: "unknown-receive",
        },
        [],
      ),
    ).toBeUndefined();
  });
});
