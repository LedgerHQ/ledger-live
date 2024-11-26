import { STAKING_ADDRESS_INDEX } from "@ledgerhq/coin-cardano/constants";
import { StakeChain } from "@ledgerhq/coin-cardano/types";
import { bip32asBuffer } from "../../crypto";
import { getBipPathFromString, getBipPathString } from "./logic";

const getSerializedAddressParameters = (
  path: string,
): {
  addressParameters: Buffer;
} => {
  const addressPath = bip32asBuffer(path);
  const stakingPath = getStakingPathFromAddressPath(path);
  const addressParameters = Buffer.concat([
    new Uint8Array(addressPath),
    new Uint8Array(Buffer.from([0x22])),
    new Uint8Array(stakingPath),
  ]);
  return {
    addressParameters: addressPath,
  };
};

function getStakingPathFromAddressPath(path: string): Buffer {
  const { account } = getBipPathFromString(path);
  const stakingPathString = getBipPathString({
    account: account,
    chain: StakeChain.stake,
    index: STAKING_ADDRESS_INDEX,
  });

  return bip32asBuffer(stakingPathString);
}

export default {
  getSerializedAddressParameters,
};
