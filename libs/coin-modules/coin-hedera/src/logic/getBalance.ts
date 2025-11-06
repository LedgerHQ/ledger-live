import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { apiClient } from "../network/api";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const [mirrorAccount, mirrorTokens] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getAccountTokens(address),
  ]);

  const balance: Balance[] = [
    {
      asset: { type: "native" },
      value: BigInt(mirrorAccount.balance.balance),
    },
  ];

  for (const mirrorToken of mirrorTokens) {
    const calToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      mirrorToken.token_id,
      currency.id,
    );

    if (!calToken) {
      continue;
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
  }

  return balance;
}
