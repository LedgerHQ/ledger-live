import Transport from "@ledgerhq/hw-transport";
export type FirmwareInfo = {
  targetId: number;
  seVersion: string;
  flags: Buffer;
  mcuVersion: string;
};
/**
 * Retrieve targetId and firmware version from device
 */

export default async function getVersion(
  transport: Transport
): Promise<FirmwareInfo> {
  const res = await transport.send(0xe0, 0x01, 0x00, 0x00);
  const byteArray = [...res];
  const data = byteArray.slice(0, byteArray.length - 2);
  const targetIdStr = Buffer.from(data.slice(0, 4));
  const targetId = targetIdStr.readUIntBE(0, 4);
  const seVersionLength = data[4];
  const seVersion = Buffer.from(data.slice(5, 5 + seVersionLength)).toString();
  const flagsLength = data[5 + seVersionLength];
  const flags = Buffer.from(
    data.slice(5 + seVersionLength + 1, 5 + seVersionLength + 1 + flagsLength)
  );
  const mcuVersionLength = data[5 + seVersionLength + 1 + flagsLength];
  let mcuVersion: Buffer | string = Buffer.from(
    data.slice(
      7 + seVersionLength + flagsLength,
      7 + seVersionLength + flagsLength + mcuVersionLength
    )
  );

  if (mcuVersion[mcuVersion.length - 1] === 0) {
    mcuVersion = mcuVersion.slice(0, mcuVersion.length - 1);
  }

  mcuVersion = mcuVersion.toString();

  if (!seVersionLength) {
    // To support old firmware like bootloader of 1.3.1
    return {
      targetId,
      seVersion: "0.0.0",
      flags: Buffer.allocUnsafeSlow(0),
      mcuVersion: "",
    };
  }

  return {
    targetId,
    seVersion,
    flags,
    mcuVersion,
  };
}
