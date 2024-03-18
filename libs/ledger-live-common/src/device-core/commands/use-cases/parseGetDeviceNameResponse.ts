import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";

export function parseGetDeviceNameResponse(response: Buffer): string {
  const tracer = new LocalTracer("hw", {
    function: "parseGetDeviceNameResponse",
  });
  const status = response.readUInt16BE(response.length - 2);
  if (tracer) tracer.trace("Result status from 0xe0d20000", { status });

  switch (status) {
    case StatusCodes.OK:
      return response.slice(0, response.length - 2).toString("utf-8");
    case StatusCodes.DEVICE_NOT_ONBOARDED:
    case StatusCodes.DEVICE_NOT_ONBOARDED_2:
      return "";
  }

  throw new TransportStatusError(status);
}
