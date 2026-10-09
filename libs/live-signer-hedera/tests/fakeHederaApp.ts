// See: https://github.com/LedgerHQ/app-hedera/blob/master/src/get_public_key.c and https://github.com/LedgerHQ/app-hedera/blob/master/src/sign_transaction.c
export type FakeHederaApp = {
  exchange(apdu: Uint8Array): { data: Uint8Array; statusCode: Uint8Array };
  rejectNext(): void;
  received: Uint8Array[];
};

const SW_OK = Uint8Array.from([0x90, 0x00]);
const SW_USER_REJECTED = Uint8Array.from([0x69, 0x85]);
const SW_UNKNOWN_INS = Uint8Array.from([0x6d, 0x00]);

const readKeyIndex = (data: Uint8Array): number =>
  new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true);

export const publicKeyFor = (keyIndex: number): Uint8Array => {
  const key = new Uint8Array(32).fill(0x11);
  new DataView(key.buffer).setUint32(0, keyIndex, true);
  return key;
};

export const signatureFor = (keyIndex: number, body: Uint8Array): Uint8Array => {
  const signature = new Uint8Array(64).fill(0x22);
  new DataView(signature.buffer).setUint32(0, keyIndex, true);
  signature.set(body.slice(0, 8), 4);
  return signature;
};

export const createFakeHederaApp = (): FakeHederaApp => {
  let reject = false;
  const received: Uint8Array[] = [];

  return {
    received,
    rejectNext() {
      reject = true;
    },
    exchange(apdu) {
      received.push(apdu);
      const [, ins, p1] = apdu;
      const data = apdu.slice(5, 5 + apdu[4]);
      const rejected = reject;
      const asksConfirmation = p1 === 0x00;
      reject = false;

      switch (ins) {
        case 0x01:
          return { data: Uint8Array.from([0, 1, 9, 2]), statusCode: SW_OK };
        case 0x02:
          if (rejected && asksConfirmation)
            return { data: new Uint8Array(), statusCode: SW_USER_REJECTED };
          return { data: publicKeyFor(readKeyIndex(data)), statusCode: SW_OK };
        case 0x04:
          if (rejected) return { data: new Uint8Array(), statusCode: SW_USER_REJECTED };
          return { data: signatureFor(readKeyIndex(data), data.slice(4)), statusCode: SW_OK };
        default:
          return { data: new Uint8Array(), statusCode: SW_UNKNOWN_INS };
      }
    },
  };
};
