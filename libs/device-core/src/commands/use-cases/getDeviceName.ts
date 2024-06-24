import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "../entities/APDU";
import { parseGetDeviceNameResponse } from "./parseGetDeviceNameResponse";

/**
 * A first APDU that we send because getDeviceName sometimes misbehaves on LNX
 * if it's not sent.
 * cf. https://github.com/LedgerHQ/ledger-live/pull/2250 where it was removed
 * cf. https://github.com/LedgerHQ/ledger-live/pull/2401 where it was added back
 */
const CLEANING_APDU: APDU = [0xe0, 0x50, 0x00, 0x00, undefined];

const GET_DEVICE_NAME_APDU: APDU = [0xe0, 0xd2, 0x00, 0x00, Buffer.from([])];

export async function getDeviceName(transport: Transport): Promise<string> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "getDeviceName",
  });
  tracer.trace("Start");

  try {
    // Legacy: prevents bad apdu response for LNX
    await transport.send(...CLEANING_APDU);
  } catch (error) {
    tracer.trace(`Error on 0xe0500000: ${error}`, { error });
  }
  tracer.trace("Sent cleaning 0xe0500000");

  const res = await transport.send(...GET_DEVICE_NAME_APDU, [
    StatusCodes.OK,
    StatusCodes.DEVICE_NOT_ONBOARDED,
    StatusCodes.DEVICE_NOT_ONBOARDED_2,
  ]);

  return parseGetDeviceNameResponse(res);
}
