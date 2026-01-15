import { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { validateAddress as tezosValidateAddress } from "@ledgerhq/coin-tezos/logic/validateAddress";
import { validateAddress as xrpValidateAddress } from "@ledgerhq/coin-xrp/logic/validateAddress";
import { validateAddress as stellarValidateAddress } from "@ledgerhq/coin-stellar/logic/validateAddress";
import { validateAddress as evmValidateAddress } from "@ledgerhq/coin-evm/logic/validateAddress";

type ValidateAddressFunction = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

const validateAddressByNetwork = new Map<string, ValidateAddressFunction>();
validateAddressByNetwork.set("stellar", stellarValidateAddress);
validateAddressByNetwork.set("xrp", xrpValidateAddress);
validateAddressByNetwork.set("ripple", xrpValidateAddress);
validateAddressByNetwork.set("tezos", tezosValidateAddress);
validateAddressByNetwork.set("evm", evmValidateAddress);

export function getValidateAddress(network: string): ValidateAddressFunction {
  const validateAddress = validateAddressByNetwork.get(network);
  if (!validateAddress) {
    throw new Error(`No validate address function for network ${network}`);
  }

  return validateAddress;
}
