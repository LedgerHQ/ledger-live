import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";

export default async (transport: Transport): Promise<string> => {
  const tracer = new LocalTracer("hw", {
    transport: transport.getTraceContext(),
    function: "getDeviceName",
  });
  tracer.trace("Start");

  try {
    // Legacy: prevents bad apdu response for LNX
    await transport.send(0xe0, 0x50, 0x00, 0x00);
  } catch (error) {
    tracer.trace(`Error on 0xe0500000: ${error}`, { error });
  }
  tracer.trace("Sent cleaning 0xe0500000");

  const res = await transport.send(0xe0, 0xd2, 0x00, 0x00, Buffer.from([]), [
    StatusCodes.OK,
    StatusCodes.DEVICE_NOT_ONBOARDED,
    StatusCodes.DEVICE_NOT_ONBOARDED_2,
  ]);

  const status = res.readUInt16BE(res.length - 2);
  tracer.trace("Result status from 0xe0d20000", { status });

  switch (status) {
    case StatusCodes.OK:
      return res.slice(0, res.length - 2).toString("utf-8");
    case StatusCodes.DEVICE_NOT_ONBOARDED:
    case StatusCodes.DEVICE_NOT_ONBOARDED_2:
      return "";
  }

  throw new TransportStatusError(status);
};
