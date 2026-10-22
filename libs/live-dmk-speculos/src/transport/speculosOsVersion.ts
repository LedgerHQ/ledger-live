import type {
  ApduResponse,
  TransportConnectedDevice,
  TransportFactory,
} from "@ledgerhq/device-management-kit";

const GET_OS_VERSION_HEADER = [0xe0, 0x01, 0x00, 0x00];
const SPECULOS_OS_VERSION = "Speculos";
const TARGET_ID_LENGTH = 4;

const isGetOsVersion = (apdu: Uint8Array) =>
  GET_OS_VERSION_HEADER.every((byte, index) => apdu[index] === byte);

const isSuccess = ({ statusCode }: ApduResponse) =>
  statusCode[0] === 0x90 && statusCode[1] === 0x00;

/**
 * Speculos reports its OS version as "Speculos", and apps that answer GetOsVersion themselves
 * (Zondax ones: Cosmos, Polkadot, Algorand, ICP) pass it on. The DMK GetOsVersion parser throws
 * on a non-semver version, and the DMK pinger sends that command unawaited on every Nano S
 * session, so the throw kills the process. An empty version is what the parser already handles
 * for firmware without one.
 */
export function normalizeSpeculosOsVersion(apdu: Uint8Array, response: ApduResponse): ApduResponse {
  if (!isGetOsVersion(apdu) || !isSuccess(response)) return response;

  const { data } = response;
  const versionStart = TARGET_ID_LENGTH + 1;
  const versionEnd = versionStart + data[TARGET_ID_LENGTH];
  if (String.fromCodePoint(...data.subarray(versionStart, versionEnd)) !== SPECULOS_OS_VERSION) {
    return response;
  }

  return {
    ...response,
    data: Uint8Array.of(...data.subarray(0, TARGET_ID_LENGTH), 0, ...data.subarray(versionEnd)),
  };
}

const withNormalizedOsVersion = (device: TransportConnectedDevice): TransportConnectedDevice => ({
  ...device,
  sendApdu: async (apdu, ...rest) =>
    (await device.sendApdu(apdu, ...rest)).map(response =>
      normalizeSpeculosOsVersion(apdu, response),
    ),
});

export function withSpeculosOsVersionNormalized(factory: TransportFactory): TransportFactory {
  return args => {
    const transport = factory(args);
    const connect = transport.connect.bind(transport);

    transport.connect = async params => (await connect(params)).map(withNormalizedOsVersion);

    return transport;
  };
}
