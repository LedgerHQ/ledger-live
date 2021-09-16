import { CroNetwork, CroSDK, utils } from "@crypto-com/chain-jslib";
export const TESTNET_CURRENCY_ID = "crypto_org_croeseid";
export const FIXED_GAS_PRICE = 0.025;
export const FIXED_DEFAULT_GAS_LIMIT = 200000;
export const TestnetCroeseid4 = {
  defaultNodeUrl: "https://testnet-croeseid-4.crypto.org",
  chainId: "testnet-croeseid-4",
  addressPrefix: "tcro",
  validatorAddressPrefix: "tcrocncl",
  validatorPubKeyPrefix: "tcrocnclconspub",
  coin: {
    baseDenom: "basetcro",
    croDenom: "tcro",
  },
  bip44Path: {
    coinType: 1,
    account: 0,
  },
  rpcUrl: "https://testnet-croeseid-4.crypto.org:26657",
};
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
          network: TestnetCroeseid4,
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
export const isValidAddress = (
  address: string,
  currencyId: string
): boolean => {
  if (!address) return false;
  const network = isTestNet(currencyId) ? TestnetCroeseid4 : CroNetwork.Mainnet;
  const addressProps = {
    address: address,
    network: network,
    type: utils.AddressType.USER,
  };
  const addressValidator = new utils.AddressValidator(addressProps);
  return addressValidator.isValid();
};
