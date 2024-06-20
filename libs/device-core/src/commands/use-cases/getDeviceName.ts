import Transport, { StatusCodes } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import { APDU } from "../entities/APDU";
import { parseGetDeviceNameResponse } from "./parseGetDeviceNameResponse";

const GET_DEVICE_NAME_APDU: APDU = [0xe0, 0xd2, 0x00, 0x00, Buffer.from([])];

export async function getDeviceName(transport: Transport): Promise<string> {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "getDeviceName",
  });
  tracer.trace("Start");

  const res = await transport.send(...GET_DEVICE_NAME_APDU, [
    StatusCodes.OK,
    StatusCodes.DEVICE_NOT_ONBOARDED,
    StatusCodes.DEVICE_NOT_ONBOARDED_2,
  ]);

  return parseGetDeviceNameResponse(res);
}
