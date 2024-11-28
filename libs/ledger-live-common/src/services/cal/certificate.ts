import { DeviceModelId } from "@ledgerhq/devices";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

type CertificateResponse = {
  id: string;
  certificate_version: {
    major: number;
    minor: number;
    patch: number;
  };
  target_device: keyof typeof DeviceModelId;
  not_valid_after: {
    major: number;
    minor: number;
    patch: number;
  };
  public_key_usage: "trusted_name";
  descriptor: {
    data: string;
    signatures: {
      prod: string;
      test: string;
    };
  };
};
export type CertificateInfo = {
  descriptor: string;
  signature: string;
};
/**
 * Retrieve PKI certificate
 * @param device
 * @param version semver
 */
export async function getCertificate(
  device: DeviceModelId,
  version: string,
  env: "prod" | "test" = "prod",
): Promise<CertificateInfo> {
  const { data } = await network<CertificateResponse[]>({
    method: "GET",
    url: `${getEnv("CAL_SERVICE_URL")}/v1/certificates`,
    params: {
      output: "id,target_device,not_valid_after,public_key_usage,certificate_version,descriptor",
      target_device: device.toLowerCase(),
      public_key_usage: "trusted_name",
      note_valid_after: version,
    },
  });

  if (data.length === 0) {
    throw new Error("Empty result");
  }

  return {
    descriptor: data[0].descriptor.data,
    signature: data[0].descriptor.signatures[env],
  };
}
