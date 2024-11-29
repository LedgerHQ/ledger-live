import network from "@ledgerhq/live-network";
import { getTrustedDomain } from "./common";

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

export async function getOwnerAddress(
  tokenAddress: string,
  challenge: string,
  env: "prod" | "test" = "prod",
): Promise<OwnerInfo> {
  const { data } = await network<OwnerAddressResponse>({
    method: "GET",
    url: `${getTrustedDomain(env)}/v2/solana/owner/${tokenAddress}?challenge=${challenge}`,
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
  env: "prod" | "test" = "prod",
): Promise<OwnerInfo> {
  const { data } = await network<OwnerAddressResponse>({
    method: "GET",
    url: `${getTrustedDomain(env)}/v2/solana/computed-token-account/${address}/${mintAddress}?challenge=${challenge}`,
  });

  return {
    tokenAccount: data.tokenAccount,
    owner: data.owner,
    contract: data.contract,
    signedDescriptor: data.signedDescriptor,
  };
}
