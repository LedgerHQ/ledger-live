import { toOffChainMessage } from "./format";

type MessageCase = {
  value: string;
  hexadecimal: string;
  messageFormat: "00" | "01";
  messageLength: string;
};

// hexadecimal of \xffsolana offchain
const SOLANA_HEADER = "ff736f6c616e61206f6666636861696e";

describe("test", () => {
  const cases: MessageCase[] = [
    {
      value: "hello",
      hexadecimal: "68656c6c6f",
      messageFormat: "01",
      messageLength: "05",
    },
    {
      value: "bonjour",
      hexadecimal: "626f6e6a6f7572",
      messageFormat: "01",
      messageLength: "07",
    },
    {
      value: "salam",
      hexadecimal: "73616c616d",
      messageFormat: "01",
      messageLength: "05",
    },
    {
      value: "Long Off-Chain Test Message.",
      hexadecimal: "4c6f6e67204f66662d436861696e2054657374204d6573736167652e",
      messageFormat: "01",
      messageLength: "1c",
    },
    {
      value: "Тестовое сообщение в формате UTF-8",
      hexadecimal:
        "d0a2d0b5d181d182d0bed0b2d0bed0b520d181d0bed0bed0b1d189d0b5d0bdd0b8d0b520d0b220d184d0bed180d0bcd0b0d182d0b5205554462d38",
      messageFormat: "01",
      messageLength: "3b",
    },
  ];

  it.each(cases)(
    'should format message "$value" correctly for off-chain signing on Solana',
    ({ value, hexadecimal, messageFormat, messageLength }) => {
      const result = toOffChainMessage(value).toString("hex");

      expect(result.startsWith(SOLANA_HEADER)).toBe(true);

      const version = result.substring(SOLANA_HEADER.length, SOLANA_HEADER.length + 2);
      expect(version).toEqual("00");

      const format = result.substring(SOLANA_HEADER.length + 2, SOLANA_HEADER.length + 4);
      expect(format).toEqual(messageFormat);

      const length = result.substring(SOLANA_HEADER.length + 4, SOLANA_HEADER.length + 6);
      expect(length).toEqual(messageLength);

      const remaining = result.substring(SOLANA_HEADER.length + 6, SOLANA_HEADER.length + 8);
      expect(remaining).toEqual("00");

      // message should end with message parameter
      expect(result.substring(SOLANA_HEADER.length + 8)).toEqual(hexadecimal);
    },
  );
});
