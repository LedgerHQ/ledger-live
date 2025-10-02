import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { hederaMirrorNode } from "../network/mirror";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const [mirrorAccount, mirrorTokens] = await Promise.all([
    hederaMirrorNode.getAccount(address),
    hederaMirrorNode.getAccountTokens(address),
  ]);

  const balance: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(mirrorAccount.balance.balance),
    },
  ];

  mirrorTokens.forEach(mirrorToken => {
    const calToken = findTokenByAddressInCurrency(mirrorToken.token_id, currency.id);

    if (!calToken) {
      return;
    }

    balance.push({
      value: BigInt(mirrorToken.balance),
      asset: {
        type: calToken.tokenType,
        assetReference: calToken.contractAddress,
        assetOwner: address,
        name: calToken.name,
        unit: calToken.units[0],
      },
    });
  });

  return balance;
}
