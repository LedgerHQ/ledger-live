export const encodeApdu = (apdu: Uint8Array): string =>
  Array.from(apdu)
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");

export const decodeHex = (hexData: string): Uint8Array =>
  new Uint8Array((hexData.match(/.{1,2}/g) ?? []).map(byte => parseInt(byte, 16)));

export const decodeApduResponseHex = (
  responseHex: string,
): { data: Uint8Array; statusCode: Uint8Array } => {
  const responseBytes = decodeHex(responseHex);
  if (responseBytes.length < 2) {
    throw new Error("APDU response too short");
  }

  return {
    data: responseBytes.slice(0, -2),
    statusCode: responseBytes.slice(-2),
  };
};
