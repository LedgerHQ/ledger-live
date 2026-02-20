import network from "@ledgerhq/live-network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNetworkConfig } from "../logic/utils";
import { AleoEncryptedRegistrationResponse } from "../types/sdk";

async function encryptRegistrationPayload({
  currency,
  publicKey,
  viewKey,
  start,
}: {
  currency: CryptoCurrency;
  publicKey: string;
  viewKey: string;
  start?: number;
}): Promise<AleoEncryptedRegistrationResponse> {
  const { sdkUrl, networkType } = getNetworkConfig(currency);

  const res = await network<AleoEncryptedRegistrationResponse>({
    method: "POST",
    url: `${sdkUrl}/network/${networkType}/encrypt_registration`,
    data: {
      public_key: publicKey,
      view_key: viewKey,
      start,
    },
  });

  return res.data;
}

export const sdkClient = {
  encryptRegistrationPayload,
};
