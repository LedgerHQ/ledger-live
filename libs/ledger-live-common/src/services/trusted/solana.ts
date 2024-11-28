// https://nft.api.live.ledger.com/v2/solana/owner/:address?challenge=

import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

type OwnerAddressResponse = {
  descriptorType: "TrustedName";
  descriptorVersion: number;
  tokenAccount: string;
  owner: string;
  contract: string;
  signedDescriptor: string;
};

export type OwnerInfo = {
  tokenAccount: string;
  owner: string;
  contract: string;
  signedDescriptor: string;
};

export async function getOwnerAddress(tokenAddress: string, challenge: string): Promise<OwnerInfo> {
  const { data } = await network<OwnerAddressResponse>({
    method: "GET",
    url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v2/solana/owner/${tokenAddress}?challenge=${challenge}`,
  });

  return {
    tokenAccount: data.tokenAccount,
    owner: data.owner,
    contract: data.contract,
    signedDescriptor: data.signedDescriptor,
  };
}

export async function computedTokenAddress(
  address: string,
  mintAddress: string,
  challenge: string,
): Promise<OwnerInfo> {
  const { data } = await network<OwnerAddressResponse>({
    method: "GET",
    url: `${getEnv("NFT_ETH_METADATA_SERVICE")}/v2/solana/computed-token-account/${address}/${mintAddress}/?challenge=${challenge}`,
  });

  return {
    tokenAccount: data.tokenAccount,
    owner: data.owner,
    contract: data.contract,
    signedDescriptor: data.signedDescriptor,
  };
}
