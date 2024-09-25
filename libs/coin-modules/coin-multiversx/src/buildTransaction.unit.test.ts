import BigNumber from "bignumber.js";
import { doBuildTransactionToSign } from "./buildTransaction";

describe("doBuildTransactionToSign", () => {
  it("should serialize transaction without data field", async () => {
    const serializedTransaction = await doBuildTransactionToSign({
      transaction: {
        family: "multiversx",
        mode: "send",
        fees: null,
        amount: new BigNumber("1"),
        recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        gasLimit: 50000000,
      },
      sender: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      nonce: 1,
      value: "0",
      minGasLimit: 50000000,
      chainID: "1",
    });

    expect(serializedTransaction).toEqual(
      `{"nonce":1,"value":"0","receiver":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","sender":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","gasPrice":1000000000,"gasLimit":50000000,"chainID":"1","version":2,"options":1}`,
    );
  });

  it("should serialize transaction with data field", async () => {
    const serializedTransaction = await doBuildTransactionToSign({
      transaction: {
        family: "multiversx",
        mode: "send",
        fees: null,
        amount: new BigNumber("1"),
        recipient: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        data: Buffer.from("ESDTTransfer@55544b2d326638306539@0de0b6b3a7640000").toString("base64"),
        gasLimit: 50000000,
      },
      sender: "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
      nonce: 1,
      value: "0",
      minGasLimit: 50000000,
      chainID: "1",
    });

    expect(serializedTransaction).toEqual(
      `{"nonce":1,"value":"0","receiver":"erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th","sender":"erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx","gasPrice":1000000000,"gasLimit":50000000,"data":"RVNEVFRyYW5zZmVyQDU1NTQ0YjJkMzI2NjM4MzA2NTM5QDBkZTBiNmIzYTc2NDAwMDA=","chainID":"1","version":2,"options":1}`,
    );
  });
});
