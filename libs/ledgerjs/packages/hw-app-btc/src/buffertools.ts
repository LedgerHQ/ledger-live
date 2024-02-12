import varuint from "varuint-bitcoin";

export function unsafeTo64bitLE(n: number): Buffer {
  // we want to represent the input as a 8-bytes array
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error("Can't convert numbers > MAX_SAFE_INT");
  }
  const byteArray = Buffer.alloc(8, 0);
  for (let index = 0; index < byteArray.length; index++) {
    const byte = n & 0xff;
    byteArray[index] = byte;
    n = (n - byte) / 256;
  }
  return byteArray;
}

export function unsafeFrom64bitLE(byteArray: Buffer): number {
  let value = 0;
  if (byteArray.length != 8) {
    throw new Error("Expected Bufffer of lenght 8");
  }
  if (byteArray[7] != 0) {
    throw new Error("Can't encode numbers > MAX_SAFE_INT");
  }
  if (byteArray[6] > 0x1f) {
    throw new Error("Can't encode numbers > MAX_SAFE_INT");
  }
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

export class BufferWriter {
  private bufs: Buffer[] = [];

  write(alloc: number, fn: (b: Buffer) => void): void {
    const b = Buffer.alloc(alloc);
    fn(b);
    this.bufs.push(b);
  }

  writeUInt8(i: number): void {
    this.write(1, b => b.writeUInt8(i, 0));
  }

  writeInt32(i: number): void {
    this.write(4, b => b.writeInt32LE(i, 0));
  }

  writeUInt32(i: number): void {
    this.write(4, b => b.writeUInt32LE(i, 0));
  }

  writeUInt64(i: number): void {
    const bytes = unsafeTo64bitLE(i);
    this.writeSlice(bytes);
  }

  writeVarInt(i: number): void {
    this.bufs.push(varuint.encode(i));
  }

  writeSlice(slice: Buffer): void {
    this.bufs.push(Buffer.from(slice));
  }

  writeVarSlice(slice: Buffer): void {
    this.writeVarInt(slice.length);
    this.writeSlice(slice);
  }

  buffer(): Buffer {
    return Buffer.concat(this.bufs);
  }
}

export class BufferReader {
  constructor(
    public buffer: Buffer,
    public offset: number = 0,
  ) {}

  available(): number {
    return this.buffer.length - this.offset;
  }

  readUInt8(): number {
    const result = this.buffer.readUInt8(this.offset);
    this.offset++;
    return result;
  }

  readInt32(): number {
    const result = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return result;
  }

  readUInt32(): number {
    const result = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return result;
  }

  readUInt64(): number {
    const buf = this.readSlice(8);
    const n = unsafeFrom64bitLE(buf);
    return n;
  }

  readVarInt(): number {
    const vi = varuint.decode(this.buffer, this.offset);
    this.offset += varuint.decode.bytes;
    return vi;
  }

  readSlice(n: number): Buffer {
    if (this.buffer.length < this.offset + n) {
      throw new Error("Cannot read slice out of bounds");
    }
    const result = this.buffer.slice(this.offset, this.offset + n);
    this.offset += n;
    return result;
  }

  readVarSlice(): Buffer {
    return this.readSlice(this.readVarInt());
  }

  readVector(): Buffer[] {
    const count = this.readVarInt();
    const vector: Buffer[] = [];
    for (let i = 0; i < count; i++) vector.push(this.readVarSlice());
    return vector;
  }
}
