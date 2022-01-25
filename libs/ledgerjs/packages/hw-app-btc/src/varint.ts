export function getVarint(data: Buffer, offset: number): [number, number] {
  if (data[offset] < 0xfd) {
    return [data[offset], 1];
  }

  if (data[offset] === 0xfd) {
    return [(data[offset + 2] << 8) + data[offset + 1], 3];
  }

  if (data[offset] === 0xfe) {
    return [
      (data[offset + 4] << 24) +
        (data[offset + 3] << 16) +
        (data[offset + 2] << 8) +
        data[offset + 1],
      5,
    ];
  }

  throw new Error("getVarint called with unexpected parameters");
}
export function createVarint(value: number): Buffer {
  if (value < 0xfd) {
    const buffer = Buffer.alloc(1);
    buffer[0] = value;
    return buffer;
  }

  if (value <= 0xffff) {
    const buffer = Buffer.alloc(3);
    buffer[0] = 0xfd;
    buffer[1] = value & 0xff;
    buffer[2] = (value >> 8) & 0xff;
    return buffer;
  }

  const buffer = Buffer.alloc(5);
  buffer[0] = 0xfe;
  buffer[1] = value & 0xff;
  buffer[2] = (value >> 8) & 0xff;
  buffer[3] = (value >> 16) & 0xff;
  buffer[4] = (value >> 24) & 0xff;
  return buffer;
}
