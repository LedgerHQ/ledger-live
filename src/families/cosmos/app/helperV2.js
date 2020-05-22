import { signSendChunkv1 } from "./helperV1";
import {
  CLA,
  errorCodeToString,
  INS,
  PAYLOAD_TYPE,
  processErrorResponse,
} from "./common";

// I think this part is the only thing we really change from the ledger-cosmos-js
// https://github.com/gagbo/ledger-cosmos-js/pull/1/files
export function serializePathv2(path) {
  const buf = Buffer.alloc(20);
  // HACK : without the >>>,
  // the bitwise implicitly casts the result to be a signed int32,
  // which fails the internal type check of Buffer in case of overload.
  buf.writeUInt32LE((0x80000000 | path[0]) >>> 0, 0);
  buf.writeUInt32LE((0x80000000 | path[1]) >>> 0, 4);
  buf.writeUInt32LE((0x80000000 | path[2]) >>> 0, 8);
  buf.writeUInt32LE(path[3], 12);
  buf.writeUInt32LE(path[4], 16);

  return buf;
}

export async function signSendChunkv2(app, chunkIdx, chunkNum, chunk) {
  let payloadType = PAYLOAD_TYPE.ADD;
  if (chunkIdx === 1) {
    payloadType = PAYLOAD_TYPE.INIT;
  }
  if (chunkIdx === chunkNum) {
    payloadType = PAYLOAD_TYPE.LAST;
  }

  return signSendChunkv1(app, payloadType, 0, chunk);
}

export async function publicKeyv2(app, data) {
  return app.transport
    .send(CLA, INS.GET_ADDR_SECP256K1, 0, 0, data, [0x9000])
    .then((response) => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
      const compressedPk = Buffer.from(response.slice(0, 33));

      return {
        pk: "OBSOLETE PROPERTY",
        compressed_pk: compressedPk,
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
      };
    }, processErrorResponse);
}
