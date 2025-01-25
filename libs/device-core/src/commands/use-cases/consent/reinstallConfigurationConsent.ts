import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { UserRefusedOnDevice, PinNotSet } from "@ledgerhq/errors";
import type { APDU } from "../../entities/APDU";
import type { ReinstallConfigArgs } from "../../entities/ReinstallConfigEntity";

/**
 * Name in documentation: REINSTALL_CONFIG
 * cla: 0xe0
 * ins: 0x6f
 * p1: 0x00
 * p2: 0x00
 * data: CHUNK_LEN + CHUNK to configure at runtime
 */
const REINSTALL_CONFIG = [0xe0, 0x6f, 0x00, 0x00] as const;

/**
 * 0x9000: Success.
 * 0xYYYY: already in REINSTALL mode
 * 0xZZZZ: if other error (TBD)
 */
const RESPONSE_STATUS_SET: number[] = [
  StatusCodes.OK,
  StatusCodes.USER_REFUSED_ON_DEVICE,
  StatusCodes.PIN_NOT_SET,
];

/**
 * Requests consent from the user to allow reinstalling all the previous
 * settings after an OS update.
 *
 * @param transport - The transport object used to communicate with the device.
 * @returns A promise that resolves when the consent is granted.
 */
export async function reinstallConfigurationConsent(
  transport: Transport,
  args: ReinstallConfigArgs,
): Promise<void> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "reinstallConfigurationConsent",
  });
  tracer.trace("Start");

  const apdu: Readonly<APDU> = [...REINSTALL_CONFIG, Buffer.from(args)];

  const response = await transport.send(...apdu, RESPONSE_STATUS_SET);

  return parseResponse(response);
}

/**
 * Parses the response data buffer, check the status code and return the data.
 *
 * @param data - The response data buffer w/ status code.
 * @returns The response data as a buffer w/o status code.
 */
export function parseResponse(data: Buffer): void {
  const tracer = new LocalTracer("hw", {
    function: "parseResponse@reinstallConfigurationConsent",
  });
  const status = data.readUInt16BE(data.length - 2);
  tracer.trace("Result status from 0xe06f0000", { status });

  switch (status) {
    case StatusCodes.OK:
      return;
    case StatusCodes.USER_REFUSED_ON_DEVICE:
      throw new UserRefusedOnDevice("User refused on device");
    case StatusCodes.PIN_NOT_SET:
      throw new PinNotSet("PIN not set");
    default:
      throw new TransportStatusError(status);
  }
}
