import network from "@ledgerhq/live-network";
import { getTrustedDomain } from "./common";

type PublicKeyResponse = {
  descriptorType: "TrustedDomainName";
  descriptorVersion: number;
  account: string;
  key: string;
  signedDescriptor: string;
  keyId: "domain_metadata_key";
  keyUsage: "trusted_name";
};

type PublicKeyInfo = {
  accountId: string;
  publicKey: string;
  signedDescriptor: string;
};

export async function getPublicKey(
  accountId: string,
  challenge: string,
  env: "prod" | "test" = "prod",
): Promise<PublicKeyInfo> {
  const { data } = await network<PublicKeyResponse>({
    method: "GET",
    url: `${getTrustedDomain(env)}/v2/hedera/pubkey/${accountId}?challenge=${challenge}`,
  });

  return {
    accountId: data.account,
    publicKey: data.key,
    signedDescriptor: data.signedDescriptor,
  };
}
