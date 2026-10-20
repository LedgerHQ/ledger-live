/* eslint-disable @typescript-eslint/consistent-type-assertions */
import {
  type ApduResponse,
  DeviceModelId,
  GetOsVersionCommand,
  type Transport,
  type TransportArgs,
} from "@ledgerhq/device-management-kit";
import { normalizeSpeculosOsVersion, withSpeculosOsVersionNormalized } from "./speculosOsVersion";

const GET_OS_VERSION_APDU = Uint8Array.of(0xe0, 0x01, 0x00, 0x00, 0x00);
const NANO_S_TARGET_ID = [0x31, 0x10, 0x00, 0x04];
const OK = Uint8Array.of(0x90, 0x00);

const lv = (value: string) => [value.length, ...Array.from(value, char => char.charCodeAt(0))];

// What Zondax apps answer to GetOsVersion on Speculos: target id, SE version, empty flags, MCU version
const osVersionResponse = (seVersion: string): ApduResponse => ({
  data: Uint8Array.of(...NANO_S_TARGET_ID, ...lv(seVersion), 0x00, ...lv("SpeculosMCU")),
  statusCode: OK,
});

const parse = (response: ApduResponse) =>
  new GetOsVersionCommand().parseResponse(response, DeviceModelId.NANO_S);

const right = <T>(value: T) => ({ map: <U>(fn: (v: T) => U) => fn(value) });

describe("normalizeSpeculosOsVersion", () => {
  it("lets the DMK parse the Speculos OS version on a Nano S", () => {
    // given
    const response = osVersionResponse("Speculos");
    expect(() => parse(response)).toThrow("Invalid Version");

    // when
    const result = parse(normalizeSpeculosOsVersion(GET_OS_VERSION_APDU, response));

    // then
    expect(result).toMatchObject({
      data: { seVersion: "0.0.0", mcuSephVersion: "SpeculosMCU", targetId: 0x31100004 },
    });
  });

  it("keeps a real OS version", () => {
    // given
    const response = osVersionResponse("2.1.0");

    // when
    const result = normalizeSpeculosOsVersion(GET_OS_VERSION_APDU, response);

    // then
    expect(result).toBe(response);
  });

  it.each([
    ["another command", Uint8Array.of(0xb0, 0x01, 0x00, 0x00, 0x00), OK],
    ["a failed GetOsVersion", GET_OS_VERSION_APDU, Uint8Array.of(0x6e, 0x00)],
  ])("keeps the response of %s", (_, apdu, statusCode) => {
    // given
    const response = { ...osVersionResponse("Speculos"), statusCode };

    // when
    const result = normalizeSpeculosOsVersion(apdu, response);

    // then
    expect(result).toBe(response);
  });
});

describe("withSpeculosOsVersionNormalized", () => {
  it("normalizes the responses of the connected device", async () => {
    // given
    const device = { id: "SpeculosID", sendApdu: jest.fn() };
    device.sendApdu.mockResolvedValue(right(osVersionResponse("Speculos")));
    const transport = {
      connect: jest.fn().mockResolvedValue(right(device)),
    } as unknown as Transport;
    const factory = withSpeculosOsVersionNormalized(() => transport);

    // when
    const connected = await factory({} as TransportArgs).connect({
      deviceId: "SpeculosID",
      onDisconnect: jest.fn(),
    });
    const response = await (connected as unknown as typeof device).sendApdu(GET_OS_VERSION_APDU);

    // then
    expect(device.sendApdu).toHaveBeenCalledWith(GET_OS_VERSION_APDU);
    expect(parse(response)).toMatchObject({ data: { seVersion: "0.0.0" } });
  });

  it("returns the transport built by the factory", () => {
    // given
    const transport = { connect: jest.fn() } as unknown as Transport;

    // when
    const result = withSpeculosOsVersionNormalized(() => transport)({} as TransportArgs);

    // then
    expect(result).toBe(transport);
  });
});
