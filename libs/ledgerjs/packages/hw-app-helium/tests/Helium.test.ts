import {
  PaymentV2,
  StakeValidatorV1,
  TokenBurnV1,
  TransferValidatorStakeV1,
  UnstakeValidatorV1,
} from "@helium/transactions";
import Address from "@helium/address";
import {
  openTransportReplayer,
  RecordStore,
} from "@ledgerhq/hw-transport-mocker";
import Helium from "../src/Helium";

test("getVersion", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
            => e001000000
            <= 0102039000
        `)
  );
  const helium = new Helium(transport);
  const result = await helium.getVersion();
  expect(result).toEqual({
    version: "1.2.3",
  });
});

const bobB58 = "13M8dUbxymE3xtiAXszRkGMmezMhBS8Li7wEsMojLdb4Sdxc4wc";
const aliceB58 = "148d8KTRcKA5JKPekBcKFd4KfvprvFRpjGtivhtmRmnZ8MFYnP3";

const DERIVATION = "44'/904'/0'/0'/0'";

test("getAddress without display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e002000015058000002c80000388800000008000000080000000
        <= 000135911a1c714d697b63ae374f9e969296c347b10027b9ff06d098e7e4e5958ed79000
    `)
  );
  const helium = new Helium(transport);
  const { address } = await helium.getAddress(DERIVATION, false);
  expect(address).toEqual(
    "13MLUBBKhTG6pbUdwwFZXnj7P4R7gB6q2janJf3fFipGjLqDV1k"
  );
});

test("getAddress with display", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e002010015058000002c80000388800000008000000080000000
        <= 000135911a1c714d697b63ae374f9e969296c347b10027b9ff06d098e7e4e5958ed79000
    `)
  );
  const helium = new Helium(transport);
  const { address } = await helium.getAddress(DERIVATION, true);
  expect(address).toEqual(
    "13MLUBBKhTG6pbUdwwFZXnj7P4R7gB6q2janJf3fFipGjLqDV1k"
  );
});

test("signPaymentV2 with no memo", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00800003a0a000000000000000000000000000000010000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c386929512250a21019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4100a20012a40af3c1a3986f42ac448755d70bfff65f583f8ab019db2a666a2a5c7ca03f3d1549acece8d935c2f9362438a348d1120f9a8648dcda35f84a028106788cf90a0009000
    `)
  );
  const helium = new Helium(transport);
  const payee = Address.fromB58(aliceB58);
  const payer = Address.fromB58(bobB58);
  const txnToSign = new PaymentV2({
    payments: [{ amount: 10, payee }],
    nonce: 1,
    payer,
  });
  const { signature, txn } = await helium.signPaymentV2(txnToSign);
  const expectedSig =
    "af3c1a3986f42ac448755d70bfff65f583f8ab019db2a666a2a5c7ca03f3d1549acece8d935c2f9362438a348d1120f9a8648dcda35f84a028106788cf90a000";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.payments[0].amount).toBe(10);
  expect(txn.nonce).toBe(1);
  expect(txn.payer?.b58).toBe(bobB58);
  expect(txn.payments[0].payee?.b58).toBe(aliceB58);
  expect(Buffer.from(txn.signature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signPaymentV2 with a memo", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00800003e0a000000000000000000000000000000010000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4796f6c6f
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c3869295122a0a21019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4100a18ca93a20320012a409eae8e4b40fd6d93ef0adfd38bd0faa4484a9bca00f85d7ec1440dbf9bedde471691c35fdfd3e1a219cd87b7f8b83eac24eed16499cdaaaab6c46d6edd7dce0a9000
    `)
  );
  const helium = new Helium(transport);
  const payee = Address.fromB58(aliceB58);
  const payer = Address.fromB58(bobB58);
  const txnToSign = new PaymentV2({
    payments: [{ amount: 10, payee, memo: "yolo" }],
    nonce: 1,
    payer,
  });
  const { signature, txn } = await helium.signPaymentV2(txnToSign);
  const expectedSig =
    "9eae8e4b40fd6d93ef0adfd38bd0faa4484a9bca00f85d7ec1440dbf9bedde471691c35fdfd3e1a219cd87b7f8b83eac24eed16499cdaaaab6c46d6edd7dce0a";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.payments[0].amount).toBe(10);
  expect(txn.nonce).toBe(1);
  expect(txn.payer?.b58).toBe(bobB58);
  expect(txn.payments[0].payee?.b58).toBe(aliceB58);
  expect(txn.payments[0].memo).toBe("yolo");
  expect(Buffer.from(txn.signature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signTokenBurnV1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00c00003b0a00000000000000000000000000000001000000000000006100019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692951221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4180a20012a40a6231956f9382ad38ccbca517a6225dfb50df64e5c9fb4372e773feb4f50a995cc4f458c8235fcf41cefa45d906988dd0e93d73b4b6464979a98d59e56cb890730009000
    `)
  );
  const helium = new Helium(transport);
  const payee = Address.fromB58(aliceB58);
  const payer = Address.fromB58(bobB58);
  const txnToSign = new TokenBurnV1({
    amount: 10,
    nonce: 1,
    payee,
    payer,
    memo: "a",
  });
  const { signature, txn } = await helium.signTokenBurnV1(txnToSign);
  const expectedSig =
    "a6231956f9382ad38ccbca517a6225dfb50df64e5c9fb4372e773feb4f50a995cc4f458c8235fcf41cefa45d906988dd0e93d73b4b6464979a98d59e56cb8907";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.amount).toBe(10);
  expect(txn.nonce).toBe(1);
  expect(txn.memo).toBe("a");
  expect(txn.payer?.b58).toBe(bobB58);
  expect(txn.payee?.b58).toBe(aliceB58);
  expect(Buffer.from(txn.signature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signStakeValidatorV1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e0090000320a00000000000000000000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4
        <= 0a21019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4122101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c3869295180a2240ea8089c76f3b829ff84bca0091690c10d8d44d03c73ce9e0757b19189d6ad9ccff429dbee3c166bdeb04dd0958371fc3569b3ab21d193050c315fabbb7524c0a9000
    `)
  );
  const helium = new Helium(transport);
  const address = Address.fromB58(aliceB58);
  const owner = Address.fromB58(bobB58);
  const txnToSign = new StakeValidatorV1({
    stake: 10,
    address,
    owner,
  });
  const { signature, txn } = await helium.signStakeValidatorV1(txnToSign);
  const expectedSig =
    "ea8089c76f3b829ff84bca0091690c10d8d44d03c73ce9e0757b19189d6ad9ccff429dbee3c166bdeb04dd0958371fc3569b3ab21d193050c315fabbb7524c0a";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.stake).toBe(10);
  expect(txn.owner?.b58).toBe(bobB58);
  expect(txn.address?.b58).toBe(aliceB58);
  expect(Buffer.from(txn.ownerSignature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signUnstakeValidatorV1", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00b00003a0a00000000000000c800000000000000000000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4
        <= 0a21019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a4122101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692951a40dae1111491dcf8d10154c352eda4c17dbb7a6ce182a49036d325f15051bf5b17e9548993abdfc11205cce3e18b9fd1ab3049922990c9ef0769ba593debc5e301280a30c8019000
    `)
  );
  const helium = new Helium(transport);
  const address = Address.fromB58(aliceB58);
  const owner = Address.fromB58(bobB58);
  const txnToSign = new UnstakeValidatorV1({
    stakeAmount: 10,
    stakeReleaseHeight: 200,
    address,
    owner,
  });
  const { signature, txn } = await helium.signUnstakeValidatorV1(txnToSign);
  const expectedSig =
    "dae1111491dcf8d10154c352eda4c17dbb7a6ce182a49036d325f15051bf5b17e9548993abdfc11205cce3e18b9fd1ab3049922990c9ef0769ba593debc5e301";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.stakeAmount).toBe(10);
  expect(txn.stakeReleaseHeight).toBe(200);
  expect(txn.owner?.b58).toBe(bobB58);
  expect(txn.address?.b58).toBe(aliceB58);
  expect(Buffer.from(txn.ownerSignature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signTransferValidatorStakeV1 as old owner", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00a0000a00a000000000000001400000000000000000000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a40001351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c386929500019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a40001351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c3869295
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692951221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a41a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692952221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a42a40bfff9c1153e6e4fdd5fcdca7c404e16627ff24689b259df0fedb90596ab31aa3ae167ea64e67c5c8c958c19b49be3d32665d23bd532e54bd126f3f7437015806324000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400a48149000
    `)
  );
  const helium = new Helium(transport);
  const oldAddress = Address.fromB58(bobB58);
  const oldOwner = Address.fromB58(bobB58);
  const newAddress = Address.fromB58(aliceB58);
  const newOwner = Address.fromB58(aliceB58);
  const txnToSign = new TransferValidatorStakeV1({
    stakeAmount: 10,
    paymentAmount: 20,
    oldAddress,
    oldOwner,
    newAddress,
    newOwner,
  });
  const { signature, txn } = await helium.signTransferValidatorStakeV1(
    txnToSign,
    "old"
  );
  const expectedSig =
    "bfff9c1153e6e4fdd5fcdca7c404e16627ff24689b259df0fedb90596ab31aa3ae167ea64e67c5c8c958c19b49be3d32665d23bd532e54bd126f3f7437015806";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.stakeAmount).toBe(10);
  expect(txn.oldOwner?.b58).toBe(oldOwner.b58);
  expect(txn.newOwner?.b58).toBe(newOwner.b58);
  expect(txn.oldAddress?.b58).toBe(oldAddress.b58);
  expect(txn.newAddress?.b58).toBe(newAddress.b58);
  expect(Buffer.from(txn.oldOwnerSignature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});

test("signTransferValidatorStakeV1 as new owner", async () => {
  const transport = await openTransportReplayer(
    RecordStore.fromString(`
        => e00a0000a00a000000000000001400000000000000000000000000000000019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a40001351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c386929500019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a40001351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c3869295
        <= 0a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692951221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a41a2101351a71c22fefec2231936ad2826b217ece39d9f77fc6c49639926299c38692952221019c659d723cc1e810a72e78f7deaf4736a87f10ef8fcfc80100b53327e7ee49a42a40b51bbc8078fa3560009b189b6de6935eb61ae7eebdc8d26cdaa70b1b8807a3b386f5a5becfebd99e1d1e93bba125deb2ba8af7239b0b115fe21d1daef9a37b0b324000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400a48149000
    `)
  );
  const helium = new Helium(transport);
  const oldAddress = Address.fromB58(bobB58);
  const oldOwner = Address.fromB58(bobB58);
  const newAddress = Address.fromB58(aliceB58);
  const newOwner = Address.fromB58(aliceB58);
  const txnToSign = new TransferValidatorStakeV1({
    stakeAmount: 10,
    paymentAmount: 20,
    oldAddress,
    oldOwner,
    newAddress,
    newOwner,
  });
  const { signature, txn } = await helium.signTransferValidatorStakeV1(
    txnToSign,
    "new"
  );
  const expectedSig =
    "b51bbc8078fa3560009b189b6de6935eb61ae7eebdc8d26cdaa70b1b8807a3b386f5a5becfebd99e1d1e93bba125deb2ba8af7239b0b115fe21d1daef9a37b0b";
  expect(signature.toString("hex")).toEqual(expectedSig);
  expect(txn.stakeAmount).toBe(10);
  expect(txn.oldOwner?.b58).toBe(oldOwner.b58);
  expect(txn.newOwner?.b58).toBe(newOwner.b58);
  expect(txn.oldAddress?.b58).toBe(oldAddress.b58);
  expect(txn.newAddress?.b58).toBe(newAddress.b58);
  expect(Buffer.from(txn.newOwnerSignature as Uint8Array).toString("hex")).toBe(
    expectedSig
  );
});
