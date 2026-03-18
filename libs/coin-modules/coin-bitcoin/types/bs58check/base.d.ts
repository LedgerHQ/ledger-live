declare module "bs58check/base" {
  export default function (checksum: (buffer: Buffer) => Buffer): bs58check;
}
