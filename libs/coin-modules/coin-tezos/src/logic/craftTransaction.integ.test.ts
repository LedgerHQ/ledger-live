import { OpKind } from "@taquito/rpc";
import { craftTransaction } from ".";
import coinConfig, { TezosCoinConfig } from "../config";
import { mockConfig } from "../test/config";

/**
 * https://teztnets.com/ghostnet-about
 * https://api.tzkt.io/#section/Get-Started/Free-TzKT-API
 */
describe("Tezos Api", () => {
  const address = "tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ";
  beforeAll(() => {
    coinConfig.setCoinConfig((): TezosCoinConfig => mockConfig as TezosCoinConfig);
  });
  it("should craft a send transaction", async () => {
    // When
    const result = await craftTransaction(
      { address },
      {
        type: "send",
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9", // spell-checker: disable-line
        amount: BigInt(10),
        fee: { fees: BigInt(1).toString() },
      },
    );

    // Then
    expect(result.type).toBe("OUT");
    expect(result.contents).toEqual(
      expect.objectContaining([
        {
          kind: OpKind.TRANSACTION,
          amount: "10",
          destination: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          source: address,
          counter: expect.any(String),
          fee: "1",
          gas_limit: "0",
          storage_limit: "0",
        },
      ]),
    );
  });

  it("should craft a delegate transaction", async () => {
    // When
    const result = await craftTransaction(
      { address },
      {
        type: "delegate",
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9", // spell-checker: disable-line
        amount: BigInt(10),
        fee: { fees: BigInt(1).toString(), gasLimit: "200", storageLimit: "300" },
      },
    );

    // Then
    expect(result.type).toBe("DELEGATE");
    expect(result.contents).toEqual(
      expect.objectContaining([
        {
          kind: OpKind.DELEGATION,
          source: address,
          counter: expect.any(String),
          delegate: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9",
          fee: "1",
          gas_limit: "200",
          storage_limit: "300",
        },
      ]),
    );
  });

  it("should craft a undelegate transaction", async () => {
    // When
    const result = await craftTransaction(
      { address },
      {
        type: "undelegate",
        recipient: "tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9", // spell-checker: disable-line
        amount: BigInt(10),
        fee: { fees: BigInt(1).toString(), gasLimit: "200", storageLimit: "300" },
      },
    );

    // Then

    expect(result.type).toBe("UNDELEGATE");
    expect(result.contents).toEqual(
      expect.objectContaining([
        {
          kind: OpKind.DELEGATION,
          source: address,
          counter: expect.any(String),
          fee: "1",
          gas_limit: "200",
          storage_limit: "300",
        },
      ]),
    );
  });

  it("should craft a send transaction from tz2 address with correct compressedreveal public key", async () => {
    // Given: LAMA account from production environment
    const tz2Address = "tz2F4XnSd1wjwWsthemvZQjoPER7NVSt35k3";
    const expectedPublicKey = "sppk7but7h93Ws1XhAPvdBcttVmoBDGHxdpaU8dPy5549f3eLJFAjag";

    // When: craft a send transaction with the public key
    const result = await craftTransaction(
      { address: tz2Address },
      {
        type: "send",
        recipient: "tz2VYbGhf44HDDYP2fepNA7n7MDHWuBe6RxD",
        amount: BigInt(1000000),
        fee: { fees: "500", gasLimit: "10000", storageLimit: "0" },
      },
      {
        publicKey: expectedPublicKey,
        publicKeyHash: tz2Address,
      },
    );

    // Then: verify the reveal operation contains the correct public key
    expect(result.type).toBe("OUT");
    expect(result.contents.length).toBeGreaterThanOrEqual(2); // Should have reveal + transaction

    const revealOp = result.contents.find(op => op.kind === OpKind.REVEAL);
    expect(revealOp).toBeDefined();
    expect(revealOp).toHaveProperty("public_key");
    expect((revealOp as any).public_key).toBe(expectedPublicKey);
    expect((revealOp as any).source).toBe(tz2Address);
  });
});
