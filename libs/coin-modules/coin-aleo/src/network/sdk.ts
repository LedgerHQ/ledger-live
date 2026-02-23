import network from "@ledgerhq/live-network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNetworkConfig } from "../logic/utils";
import type { AleoEncryptedRegistrationResponse } from "../types/sdk";

async function encryptRegistrationPayload({
  currency,
  publicKey,
  viewKey,
  start,
}: {
  currency: CryptoCurrency;
  publicKey: string;
  viewKey: string;
  start: number;
}): Promise<AleoEncryptedRegistrationResponse> {
  const { sdkUrl } = getNetworkConfig(currency);

  const res = await network<AleoEncryptedRegistrationResponse>({
    method: "POST",
    url: `${sdkUrl}/encrypt_registration`,
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
