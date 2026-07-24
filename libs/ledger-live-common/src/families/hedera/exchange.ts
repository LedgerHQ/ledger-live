import { LatestFirmwareVersionRequired } from "../../errors";
import Exchange from "@ledgerhq/hw-app-exchange";
import { loadPKI } from "@ledgerhq/hw-bolos";
import calService from "@ledgerhq/ledger-cal-service";
import trustService from "@ledgerhq/ledger-trust-service";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Account } from "@ledgerhq/types-live";

function isPKIUnsupportedError(err: unknown): boolean {
  const errName = (err as { name?: string })?.name;
  return (
    errName === "TransportStatusError" &&
    !!(err as { message?: string })?.message?.includes("0x6a81")
  );
}

export async function handleHederaTrustedFlow({
  exchange,
  hederaAccount,
  deviceModelId,
}: {
  exchange: Exchange;
  hederaAccount: Account;
  deviceModelId: DeviceModelId;
}) {
  const serviceEnv = getEnv("MOCK_EXCHANGE_TEST_CONFIG") ? "test" : "prod";

  const cert = await calService.getCertificate(deviceModelId, "trusted_name", "latest", {
    env: serviceEnv,
    signatureKind: serviceEnv,
  });

  try {
    await loadPKI(exchange.transport, "TRUSTED_NAME", cert.descriptor, cert.signature);
  } catch (err) {
    if (isPKIUnsupportedError(err)) {
      throw new LatestFirmwareVersionRequired("LatestFirmwareVersionRequired");
    }
  }

  const challenge = await exchange.getChallenge();
  const hexChallenge = challenge.toString(16);

  const trustServiceResult = await trustService.hedera.getPublicKey(
    hederaAccount.freshAddress,
    hexChallenge,
  );
  const signedDescriptorBuffer = Buffer.from(trustServiceResult.signedDescriptor, "hex");

  await exchange.sendTrustedDescriptor(signedDescriptorBuffer);
}
