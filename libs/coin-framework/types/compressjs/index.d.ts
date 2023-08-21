declare module '@ledgerhq/compressjs' {
  declare namespace Bzip2 {
    declare function compressFile(stream: Buffer): WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>
    declare function decompressFile(stream: Buffer): WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>
  }
}
