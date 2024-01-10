import { AppType, type App } from "@ledgerhq/types-live";

/**
 * Builds a fake App object to use in tests
 *
 * @param props Any value in props will override the default fake value of the same property
 * @return A fake App object
 */
export const anAppBuilder = (props?: Partial<App>): App => {
  return {
    id: 4242,
    name: "AnApp",
    displayName: "AnApp",
    version: "1.10.2",
    currencyId: "aCurrency",
    description: "",
    type: AppType.currency,
    dateModified: "2023-06-26T11:37:32.820645Z",
    icon: "ethereum",
    authorName: "Ledger",
    supportURL: "",
    contactURL: "",
    sourceURL: "",
    hash: "e1c24ea722f537af06f0ce8715200d99faec25153c8e8dc625f476a48d00215f",
    perso: "perso_11",
    firmware: "stax/1.2.1-il3/ethereum/app_1.10.2",
    firmware_key: "stax/1.2.1-il3/ethereum/app_1.10.2_key",
    delete: "stax/1.2.1-il3/ethereum/app_1.10.2_del",
    delete_key: "stax/1.2.1-il3/ethereum/app_1.10.2_del_key",
    dependencies: [],
    bytes: 107536,
    warning: null,
    indexOfMarketCap: 1,
    isDevTools: false,
    ...props,
  };
};
