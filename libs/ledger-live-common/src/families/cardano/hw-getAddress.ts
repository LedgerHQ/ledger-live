import type { Resolver } from "../../hw/getAddress/types";
import Ada, { Networks, AddressType } from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { str_to_path } from "@cardano-foundation/ledgerjs-hw-app-cardano/dist/utils";
import { getBipPathFromString, getBipPathString } from "./logic";
import { StakeChain } from "./types";
import { STAKING_ADDRESS_INDEX } from "./constants";
import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { address as TyphonAddress } from "@stricahq/typhonjs";
import { getNetworkParameters } from "./networks";

const resolver: Resolver = async (transport, { path, verify, currency }) => {
  const spendingPath = getBipPathFromString(path);
  const stakingPathString = getBipPathString({
    account: spendingPath.account,
    chain: StakeChain.stake,
    index: STAKING_ADDRESS_INDEX,
  });
  const networkParams = getNetworkParameters(currency.id);
  const network =
    networkParams.networkId === Networks.Mainnet.networkId ? Networks.Mainnet : Networks.Testnet;

  const ada = new Ada(transport);
  const r = await ada.deriveAddress({
    network,
    address: {
      type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
      params: {
        spendingPath: str_to_path(path),
        stakingPath: str_to_path(stakingPathString),
      },
    },
  });
  if (verify) {
    await ada.showAddress({
      network,
      address: {
        type: AddressType.BASE_PAYMENT_KEY_STAKE_KEY,
        params: {
          spendingPath: str_to_path(path),
          stakingPath: str_to_path(stakingPathString),
        },
      },
    });
  }
  const address = TyphonUtils.getAddressFromHex(r.addressHex) as TyphonAddress.BaseAddress;
  return {
    address: address.getBech32(),
    // Here, we use publicKey hash, as cardano app doesn't export the public key
    publicKey: address.paymentCredential.hash,
    path,
  };
};

export default resolver;
