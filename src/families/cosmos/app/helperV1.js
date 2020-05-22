import { CLA, errorCodeToString, INS, processErrorResponse } from "./common";

export function serializePathv1(path) {
  if (path.length > 10) {
    throw new Error("Invalid path. Length should be <= 10");
  }
  const buf = Buffer.alloc(1 + 4 * path.length);
  buf.writeUInt8(path.length, 0);
  for (let i = 0; i < path.length; i += 1) {
    let v = path[i];
    if (i < 3) {
      // eslint-disable-next-line no-bitwise
      v |= 0x80000000; // Harden
    }
    buf.writeInt32LE(v, 1 + i * 4);
  }
  return buf;
}

export async function signSendChunkv1(app, chunkIdx, chunkNum, chunk) {
  return app.transport
    .send(CLA, INS.SIGN_SECP256K1, chunkIdx, chunkNum, chunk, [
      0x9000,
      0x6984,
      0x6a80,
    ])
    .then((response) => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
      let errorMessage = errorCodeToString(returnCode);

      if (returnCode === 0x6a80 || returnCode === 0x6984) {
        errorMessage = `${errorMessage} : ${response
          .slice(0, response.length - 2)
          .toString("ascii")}`;
      }

      let signature = null;
      if (response.length > 2) {
        signature = response.slice(0, response.length - 2);
      }

      return {
        signature,
        return_code: returnCode,
        error_message: errorMessage,
      };
    }, processErrorResponse);
}

function compressPublicKey(publicKey) {
  if (publicKey.length !== 65) {
    throw new Error("decompressed public key length should be 65 bytes");
  }
  const y = publicKey.slice(33, 65);
  // eslint-disable-next-line no-bitwise
  const z = Buffer.from([2 + (y[y.length - 1] & 1)]);
  return Buffer.concat([z, publicKey.slice(1, 33)]);
}

export async function publicKeyv1(app, data) {
  return app.transport
    .send(CLA, INS.INS_PUBLIC_KEY_SECP256K1, 0, 0, data, [0x9000])
    .then((response) => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
      const pk = Buffer.from(response.slice(0, 65));

      return {
        pk,
        compressed_pk: compressPublicKey(pk),
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
      };
    }, processErrorResponse);
}
