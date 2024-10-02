export default class BigEndian {
  public static shortToArray(n: number): Uint8Array {
    const array = new Uint8Array(2);
    const view = new DataView(array.buffer);
    view.setUint16(0, n, false);
    return array;
  }

  public static arrayToShort(array: Uint8Array): number {
    const view = new DataView(array.buffer);
    return view.getUint16(0, false);
  }

  public static numberToArray(n: number): Uint8Array {
    const array = new Uint8Array(4);
    const view = new DataView(array.buffer);
    view.setUint32(0, n, false);
    return array;
  }

  public static arrayToNumber(array: Uint8Array): number {
    const view = new DataView(array.buffer);
    return view.getUint32(0, false);
  }
}
