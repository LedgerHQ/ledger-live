import { getAccountShape } from "@ledgerhq/coin-evm/synchronization";
import { emptyHistoryCache } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export const buildAccount = async (address: string) => {
  const currency = getCryptoCurrencyById("ethereum_sepolia");
  const infos = {
    currency,
    index: 0,
    address,
    derivationPath: "44'/60'/0'/0/0",
    derivationMode: "",
    rest: {
      publicKey:
        "0497b3cc6fd3ebd3b779bab0169e77f54abf060d414801e5d66f40edefafec2c4c54b813fdd083e3a4defef284c31fb040a708a6a22a36d467bd1cd260979f2b93",
    },
    deviceId: "",
  };

  const accountShape = await getAccountShape(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    infos,
    {
      paginationConfig: {
        operations: 20,
      },
    },
  );
  return {
    ...accountShape,
    ...infos,
    pendingOperations: [],
    freshAddress: [address],
    balanceHistoryCache: emptyHistoryCache,
    isSmartAccount: true,
    name: "Ethereum Sepolia Smart Account",
    unit: currency.units[0],
  };
};
