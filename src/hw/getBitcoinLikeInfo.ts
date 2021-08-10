import Transport from "@ledgerhq/hw-transport";

// Returns null if getBitcoinLikeInfo is not supported. there are breaking changes in the version after firmware 1.2
const getBitcoinLikeInfo = (
  transport: Transport
): Promise<
  | {
      P2PKH: number;
      P2SH: number;
      message: Buffer;
      short: Buffer;
    }
  | null
  | undefined
> =>
  transport.send(0xe0, 0x16, 0x00, 0x00).then((res) => {
    const P2PKH = res.readUInt16BE(0);
    const P2SH = res.readUInt16BE(2);

    try {
      const message = res.slice(5, res.readUInt8(4));
      const short = res.slice(
        5 + message.length + 1,
        res.readUInt8(5 + message.length)
      );
      return {
        P2PKH,
        P2SH,
        message,
        short,
      };
    } catch (e) {
      // in such case, we are in an old firmware we no longer support
      return null;
    }
  });

export default getBitcoinLikeInfo;
