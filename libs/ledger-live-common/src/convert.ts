export function hexstring2ab(str: any): Uint8Array {
  if (!str.length) {
    return new Uint8Array(0);
  }

  const iters = str.length / 2;
  const result = new Uint8Array(iters);

  for (let i = 0; i < iters; i++) {
    result[i] = parseInt(str.substring(0, 2), 16);
    str = str.substring(2);
  }

  return result;
}
export function ab2hexstring(arr: ArrayBufferLike): string {
  if (typeof arr !== "object") {
    throw new Error(`ab2hexstring expects an array. Input was ${arr}`);
  }

  let result = "";
  const intArray = new Uint8Array(arr);

  for (const i of intArray) {
    let str = i.toString(16);
    str = str.length === 0 ? "00" : str.length === 1 ? "0" + str : str;
    result += str;
  }

  return result;
}
export function reverseHex(hex: string): string {
  let out = "";

  for (let i = hex.length - 2; i >= 0; i -= 2) {
    out += hex.substr(i, 2);
  }

  return out;
}
