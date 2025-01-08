import LedgerAccount from "./LedgerAccount";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import { AccountAddress, Hex } from "@aptos-labs/ts-sdk";
import HwAptos from "@ledgerhq/hw-app-aptos";
import Transport from "@ledgerhq/hw-transport";
import { AptosAPI } from "./api";
import { APTOS_ASSET_ID } from "./constants";
import { Account } from "../../e2e/enum/Account";

jest.mock("@ledgerhq/hw-app-aptos");

describe("LedgerAccount Test", () => {
  it("Testing constructor", async () => {
    const account = createFixtureAccount();
    const ledger_account = new LedgerAccount(account.freshAddressPath);
    const expected = {
      hdPath: account.freshAddressPath,
      publicKey: Buffer.from([]),
      accountAddress: new AccountAddress(new Uint8Array(AccountAddress.LENGTH)),
    };
    expect(ledger_account).toEqual(expected);
  });

  it("Testing init method", async () => {
    const account = createFixtureAccount();
    const ledger_account = new LedgerAccount(account.freshAddressPath);
    const transport = {} as Transport;
    const mockGetAddress = jest.fn().mockResolvedValue({
      address: account.freshAddress,
      publicKey: Buffer.from("publicKey"),
    });
    HwAptos.mockImplementation(() => {
      return {
        getAddress: mockGetAddress,
      };
    });

    await ledger_account.init(transport);

    expect(mockGetAddress).toHaveBeenCalledWith(account.freshAddressPath, false);
    expect(ledger_account["publicKey"]).toEqual(Buffer.from("publicKey"));
    expect(ledger_account["accountAddress"]).toEqual(AccountAddress.from(account.freshAddress));
  });

  it("Testing authKey method", () => {
    const account = createFixtureAccount();
    const ledger_account = new LedgerAccount(account.freshAddressPath, account.freshAddress);
    const authKey = ledger_account.authKey();

    expect(authKey).toBeInstanceOf(AccountAddress);
  });

  it("Testing asyncSignBuffer method", async () => {
    const account = createFixtureAccount();
    const ledger_account = new LedgerAccount(account.freshAddressPath);
    const transport = {} as Transport;
    const mockSignTransaction = jest.fn().mockResolvedValue({
      signature: Buffer.from("signature"),
    });
    const mockGetAddress = jest.fn().mockResolvedValue({
      address: account.freshAddress,
      publicKey: Buffer.from("publicKey"),
    });
    HwAptos.mockImplementation(() => {
      return {
        signTransaction: mockSignTransaction,
        getAddress: mockGetAddress,
      };
    });

    await ledger_account.init(transport);
    const buffer = new Uint8Array([1, 2, 3]);
    const signature = await ledger_account.asyncSignBuffer(buffer);

    expect(mockSignTransaction).toHaveBeenCalledWith(account.freshAddressPath, Buffer.from(buffer));
    expect(signature).toEqual(new Hex(new Uint8Array(Buffer.from("signature"))));
  });

  it("Testing signTransaction method", async () => {
    const api = new AptosAPI("aptos");
    const account = createFixtureAccount();
    const ledger_account = new LedgerAccount(account.freshAddressPath);
    const transport = {} as Transport;

    const mockSignTransaction = jest.fn().mockResolvedValue({
      signature: Buffer.from("0x13321ab5d9da6ea27ff47a89f55bb384f0cc0b04a755d5098fc5e0653179a1"), // random hex to fulfill expectation of 64 length
    });
    const mockGetAddress = jest.fn().mockResolvedValue({
      address: account.freshAddress,
      publicKey: Buffer.from("0x13321ab5d9da6ea27ff47a89f55bb8"), // random hex to fulfill expectations of 32 length
      chainCode: Buffer.from(""),
    });

    HwAptos.mockImplementation(() => {
      return {
        signTransaction: mockSignTransaction,
        getAddress: mockGetAddress,
      };
    });

    await ledger_account.init(transport);
    const payload = {
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: [APTOS_ASSET_ID],
      functionArguments: [Account.APTOS_1.address, BigInt(1).toString()],
    };
    const options = {
      maxGasAmount: "100",
      gasUnitPrice: "50",
      sequenceNumber: "1",
      expirationTimestampSecs: "1735639799486",
    };

    const rawTxn = await api.generateTransaction(account.freshAddress, payload, options);
    const signedTxn = await ledger_account.signTransaction(rawTxn);

    expect(signedTxn).toBeInstanceOf(Uint8Array);
  });
});
