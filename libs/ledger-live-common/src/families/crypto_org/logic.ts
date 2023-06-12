import { CroNetwork, CroSDK, utils } from "@crypto-org-chain/chain-jslib";
export const TESTNET_CURRENCY_ID = "crypto_org_croeseid";
export const FIXED_GAS_PRICE = 0.025;
export const FIXED_DEFAULT_GAS_LIMIT = 200000;
const croSdks = {};

/**
 * Returns true if we are using testnet
 *
 * @param {string} currency
 */
export function isTestNet(currencyId: string) {
  return currencyId == TESTNET_CURRENCY_ID;
}

/**
 * Get CroSdk
 * @param {string} currency
 */
export function getCroSdk(currencyId: string) {
  if (!croSdks[currencyId]) {
    croSdks[currencyId] = isTestNet(currencyId)
      ? CroSDK({
          network: CroNetwork.TestnetCroeseid4,
        })
      : CroSDK({
          network: CroNetwork.Mainnet,
        });
  }

  return croSdks[currencyId];
}

/**
 * Returns true if address is a valid md5
 *
 * @param {string} address
 * @param {boolean} useTestNet
 */
export const isValidAddress = (address: string, currencyId: string): boolean => {
  if (!address) return false;
  const network = isTestNet(currencyId) ? CroNetwork.TestnetCroeseid4 : CroNetwork.Mainnet;
  const addressProps = {
    address: address,
    network: network,
    type: utils.AddressType.USER,
  };
  const addressValidator = new utils.AddressValidator(addressProps);
  return addressValidator.isValid();
};
