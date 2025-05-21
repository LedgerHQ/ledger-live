import { PublicKey } from "@solana/web3.js";
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
  const sharedCases: MessageCase[] = [
    {
      value: "hello",
      hexadecimal: "68656c6c6f",
      messageFormat: "00",
      messageLength: "0500",
    },
    {
      value: "bonjour",
      hexadecimal: "626f6e6a6f7572",
      messageFormat: "00",
      messageLength: "0700",
    },
    {
      value: "salam",
      hexadecimal: "73616c616d",
      messageFormat: "00",
      messageLength: "0500",
    },
    {
      value: "Long Off-Chain Test Message.",
      hexadecimal: "4c6f6e67204f66662d436861696e2054657374204d6573736167652e",
      messageFormat: "00",
      messageLength: "1c00",
    },
    {
      value: "Тестовое сообщение в формате UTF-8",
      hexadecimal:
        "d0a2d0b5d181d182d0bed0b2d0bed0b520d181d0bed0bed0b1d189d0b5d0bdd0b8d0b520d0b220d184d0bed180d0bcd0b0d182d0b5205554462d38",
      messageFormat: "01",
      messageLength: "3b00",
    },
  ];

  const cases: MessageCase[] = [
    ...sharedCases,
    {
      value: `example.com wants you to sign in with your Solana account: test-account
URI: http://localhost:3000
Version: 1
Network: mainnet
Nonce: once
Issued At: now`,
      hexadecimal:
        "6578616d706c652e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a20746573742d6163636f756e740a5552493a20687474703a2f2f6c6f63616c686f73743a333030300a56657273696f6e3a20310a4e6574776f726b3a206d61696e6e65740a4e6f6e63653a206f6e63650a4973737565642041743a206e6f77",
      messageFormat: "00",
      messageLength: "9900",
    },
    {
      value: `shop.ledger.com wants you to sign in with your Solana account: 2XUhv9PZohcQrwsx3AnYMrHCbssWZuAFdwixd67ZYhYN
URI: http://localhost:3000
Version: 1
Network: mainnet
Nonce: 2XUhv9PZohcQrwsx3AnYMrHCbssWZuAFdwixd67ZYhYN-nonce
Issued At: now`,
      hexadecimal:
        "73686f702e6c65646765722e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a20325855687639505a6f6863517277737833416e594d724843627373575a754146647769786436375a5968594e0a5552493a20687474703a2f2f6c6f63616c686f73743a333030300a56657273696f6e3a20310a4e6574776f726b3a206d61696e6e65740a4e6f6e63653a20325855687639505a6f6863517277737833416e594d724843627373575a754146647769786436375a5968594e2d6e6f6e63650a4973737565642041743a206e6f77",
      messageFormat: "00",
      messageLength: "eb00",
    },
  ];

  const address = "8DpKDisipx6f76cEmuGvCX9TrA3SjeR76HaTRePxHBDe";
  const addressHex = new PublicKey(address).toBuffer().toString("hex");
  const emptyApplicationDomain = "0000000000000000000000000000000000000000000000000000000000000000";

  it.each(cases)(
    'should format message "$value" correctly for off-chain signing on Solana',
    ({ value, hexadecimal, messageFormat, messageLength }) => {
      const result = toOffChainMessage(value, address, false).toString("hex");

      expect(result.startsWith(SOLANA_HEADER)).toBe(true);

      const version = result.substring(SOLANA_HEADER.length, SOLANA_HEADER.length + 2);
      expect(version).toEqual("00");

      const applicationDomain = result.substring(
        SOLANA_HEADER.length + 2,
        SOLANA_HEADER.length + 66,
      );
      expect(applicationDomain).toEqual(emptyApplicationDomain);

      const format = result.substring(SOLANA_HEADER.length + 66, SOLANA_HEADER.length + 68);
      expect(format).toEqual(messageFormat);

      const signerCount = result.substring(SOLANA_HEADER.length + 68, SOLANA_HEADER.length + 70);
      expect(signerCount).toEqual("01");

      const signerAddress = result.substring(SOLANA_HEADER.length + 70, SOLANA_HEADER.length + 134);
      expect(signerAddress).toEqual(addressHex);

      const length = result.substring(SOLANA_HEADER.length + 134, SOLANA_HEADER.length + 138);
      expect(length).toEqual(messageLength);

      // message should end with message parameter
      expect(result.substring(SOLANA_HEADER.length + 138)).toEqual(hexadecimal);
    },
  );

  const legacyCases: MessageCase[] = [
    ...sharedCases,
    {
      value: `example.com wants you to sign in with your Solana account: test-account
URI: http://localhost:3000
Version: 1
Network: mainnet
Nonce: once
Issued At: now`,
      hexadecimal:
        "6578616d706c652e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a20746573742d6163636f756e740a5552493a20687474703a2f2f6c6f63616c686f73743a333030300a56657273696f6e3a20310a4e6574776f726b3a206d61696e6e65740a4e6f6e63653a206f6e63650a4973737565642041743a206e6f77",
      messageFormat: "01",
      messageLength: "9900",
    },
    {
      value: `shop.ledger.com wants you to sign in with your Solana account: 2XUhv9PZohcQrwsx3AnYMrHCbssWZuAFdwixd67ZYhYN
URI: http://localhost:3000
Version: 1
Network: mainnet
Nonce: 2XUhv9PZohcQrwsx3AnYMrHCbssWZuAFdwixd67ZYhYN-nonce
Issued At: now`,
      hexadecimal:
        "73686f702e6c65646765722e636f6d2077616e747320796f7520746f207369676e20696e207769746820796f757220536f6c616e61206163636f756e743a20325855687639505a6f6863517277737833416e594d724843627373575a754146647769786436375a5968594e0a5552493a20687474703a2f2f6c6f63616c686f73743a333030300a56657273696f6e3a20310a4e6574776f726b3a206d61696e6e65740a4e6f6e63653a20325855687639505a6f6863517277737833416e594d724843627373575a754146647769786436375a5968594e2d6e6f6e63650a4973737565642041743a206e6f77",
      messageFormat: "01",
      messageLength: "eb00",
    },
  ];

  it.each(legacyCases)(
    'should format message "$value" correctly for off-chain signing on Solana legacy',
    ({ value, hexadecimal, messageFormat, messageLength }) => {
      const result = toOffChainMessage(value, address, true).toString("hex");

      expect(result.startsWith(SOLANA_HEADER)).toBe(true);

      const version = result.substring(SOLANA_HEADER.length, SOLANA_HEADER.length + 2);
      expect(version).toEqual("00");

      const format = result.substring(SOLANA_HEADER.length + 2, SOLANA_HEADER.length + 4);
      expect(format).toEqual(messageFormat);

      const length = result.substring(SOLANA_HEADER.length + 4, SOLANA_HEADER.length + 8);
      expect(length).toEqual(messageLength);

      // message should end with message parameter
      expect(result.substring(SOLANA_HEADER.length + 8)).toEqual(hexadecimal);
    },
  );
});
