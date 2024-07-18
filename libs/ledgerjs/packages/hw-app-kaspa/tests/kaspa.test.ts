import {
    openTransportReplayer,
    RecordStore,
  } from "@ledgerhq/hw-transport-mocker";
import Kaspa from "../src/kaspa";
import { TransactionInput, TransactionOutput, Transaction } from "../src/transaction";

describe("kaspa", () => {
    it("getVersion", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e004000000
                  <= 0105069000
              `)
        );
        const kaspa = new Kaspa(transport);
        const result = await kaspa.getVersion();
        expect(result).toEqual({
            version: "1.5.6"
        });
    });

    it("getPublicKey without display (implicit)", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e005000015058000002c8001b207800000000000000000000000
                  <= deadbeef9000
              `)
        );
        const kaspa = new Kaspa(transport);
        const publicKey = await kaspa.getPublicKey("44'/111111'/0'/0/0");
        expect(publicKey.toString("hex")).toEqual("deadbeef");
    });
    
    it("getPublicKey without display", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e005000015058000002c8001b207800000000000000000000000
                  <= deadbeef9000
              `)
        );
        const kaspa = new Kaspa(transport);
        const publicKey = await kaspa.getPublicKey("44'/111111'/0'/0/0", false);
        expect(publicKey.toString("hex")).toEqual("deadbeef");
    });
    
    it("getPublicKey with display", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                  => e005010015058000002c8001b207800000000000000000000000
                  <= deadbeef9000
              `)
        );
        const kaspa = new Kaspa(transport);
        const publicKey = await kaspa.getPublicKey("44'/111111'/0'/0/0", true);
        expect(publicKey.toString("hex")).toEqual("deadbeef");
    });

    it("signTransaction with simple data", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00600800d00000101010203040580000000
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602002e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 000040ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a32000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405,
        });

        try {
            await kaspa.signTransaction(tx);
            expect(txin.signature).toEqual("ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3");
            expect(txin.sighash).toEqual("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
        } catch (e) {
            console.error(e);
            expect(e).toBe(null);
        }
    });

    it("signTransaction with multi inputs", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00600800d00000102010203040580000000
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602802e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 9000
                => e00602002e000000000010c8e040aa22362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 010040ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a32000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
                => e006030000
                <= 000140b33f7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a32000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin1 = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txin2 = new TransactionInput({
            prevTxId: "40aa22362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin1, txin2],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405,
        });

        try {
            await kaspa.signTransaction(tx);
            expect(txin1.signature).toEqual("ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3");
            expect(txin1.sighash).toEqual("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");

            expect(txin2.signature).toEqual("b33f7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3");
            expect(txin2.sighash).toEqual("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
        } catch (e) {
            console.error(e);
            expect(e).toBe(null);
        }
    });

    it("signTransaction should always have sigLen = 64", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00600800d00000101010203040580000000
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602002e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 00004100ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a32000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405,
        });

        let err: any = null;
        try {
            await kaspa.signTransaction(tx);
        } catch (e) {
            err = e;
        }

        expect(err.name).not.toBe('RecordStoreWrongAPDU');
        expect(err).not.toBe(null);
    });

    it("signTransaction should always have sighashLen = 32", async () => {
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00600800d00000101010203040580000000
                <= 9000
                => e00601802a000000000010a1d02011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac
                <= 9000
                => e00602002e000000000010c8e040b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70000000000000
                <= 000040ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3210000112233445566778899aabbccddeeff00112233445566778899aabbccddeeff9000
            `)
        );
        const kaspa = new Kaspa(transport);

        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405,
        });

        let err: any = null;
        try {
            await kaspa.signTransaction(tx);
        } catch (e) {
            err = e;
        }

        expect(err.name).not.toBe('RecordStoreWrongAPDU');
        expect(err).not.toBe(null);
    });

    it("Transaction should set default change address index and type", () => {
        const tx = new Transaction({
            version: 0,
            inputs: [],
            outputs: [],
        });

        expect(tx.changeAddressIndex).toEqual(0);
        expect(tx.changeAddressType).toEqual(0);
    });

    it("TransactionInput should show null for signatureScript when unsigned", () => {
        const txin = new TransactionInput({
            prevTxId: "",
            value: 0,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        expect(txin.toApiJSON().signatureScript).toEqual(null);

        const expectedSignature = "ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3";
        txin.setSignature(expectedSignature);

        expect(txin.toApiJSON().signatureScript).toEqual(`41${expectedSignature}01`);
    });

    it("signMessage with simple data", async () => {
        const expectedSignature = 'ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3';
        const expectedMessageHash = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e0070000160000000000800000000c48656c6c6f204b6173706121
                <= 40${expectedSignature}20${expectedMessageHash}9000
            `)
        );
        const kaspa = new Kaspa(transport);

        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!', 0, 0);
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            console.error(e);
            expect(e).toBe(null);
        }
    });

    it("signMessage requires valid address index", async () => {
        const expectedSignature = 'ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3';
        const expectedMessageHash = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00700001600000000008000000000c48656c6c6f204b6173706121
                <= 40${expectedSignature}20${expectedMessageHash}9000
            `)
        );
        const kaspa = new Kaspa(transport);

        let err: any = null;
        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!', 0, -1);
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("signMessage requires valid account", async () => {
        const expectedSignature = 'ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3';
        const expectedMessageHash = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00700001600000000008000000000c48656c6c6f204b6173706121
                <= 40${expectedSignature}20${expectedMessageHash}9000
            `)
        );
        const kaspa = new Kaspa(transport);

        let err: any = null;
        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!', 0, 0, 0x80000000 - 1);
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);

        err = null;
        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!', 0, 0, 0xFFFFFFFF + 1);
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("signMessage sets default values for index and account", async () => {
        const expectedSignature = 'ec4a7f581dc2450ab43b412a67bdfdafa6f98281f854a1508852042e41ef86695ec7f0fa36122193fa201ce783618710d65c85cf94640cb93e965f5158fd84a3';
        const expectedMessageHash = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
        const transport = await openTransportReplayer(
            RecordStore.fromString(`
                => e00700001600000000008000000000c48656c6c6f204b6173706121
                <= 40${expectedSignature}20${expectedMessageHash}9000
            `)
        );
        const kaspa = new Kaspa(transport);

        let err: any = null;
        try {
            const { signature, messageHash } = await kaspa.signMessage('Hello Kaspa!');
            expect(signature).toEqual(expectedSignature);
            expect(messageHash).toEqual(messageHash);
        } catch (e) {
            err = e;
        }
    });
});

describe("Transaction", () => {
    it("should serialize", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405
        });

        const expectation = Buffer.from([0x00, 0x00, 0x01, 0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x80, 0x00, 0x00, 0x00]);

        expect(tx.serialize().equals(expectation)).toBeTruthy();
    });

    it("should check that change address type is 0 or 1", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        let err: any = null;
        try {
            new Transaction({
                version: 0,
                inputs: [txin],
                outputs: [txout],
                changeAddressType: 2,
                changeAddressIndex: 0x02030405
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should check that account is in 0x80000000 and 0xFFFFFFFF", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        let err: any = null;
        try {
            new Transaction({
                version: 0,
                inputs: [txin],
                outputs: [txout],
                changeAddressType: 0,
                changeAddressIndex: 0x02030405,
                account: 0x80000000 - 1,
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should check that change address index to be in range", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        let err: any = null;
        try {
            new Transaction({
                version: 0,
                inputs: [txin],
                outputs: [txout],
                changeAddressType: 0,
                changeAddressIndex: -1
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should check that API JSON is producible", () => {
        const txin = new TransactionInput({
            prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
            value: 1100000,
            addressType: 0,
            addressIndex: 0,
            outpointIndex: 0,
        });

        const txout = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        });

        const tx = new Transaction({
            version: 0,
            inputs: [txin],
            outputs: [txout],
            changeAddressType: 1,
            changeAddressIndex: 0x02030405
        });

        const json = tx.toApiJSON().transaction;
        expect(json.version).toEqual(0);
        expect(json.inputs.length).toEqual(1);
        expect(json.outputs.length).toEqual(1);
        expect(json.lockTime).toEqual(0);
        expect(json.subnetworkId).toEqual("0000000000000000000000000000000000000000");
    });
});

describe("TransactionInput", () => {
    it("should allow for highest possible kaspa value", () => {
        let err: any = null;

        try {
            const txin1 = new TransactionInput({
                prevTxId: "40b022362f1a303518e2b49f86f87a317c87b514ca0f3d08ad2e7cf49d08cc70",
                value: 18446744073709551615,
                addressType: 0,
                addressIndex: 0,
                outpointIndex: 0,
            });

            txin1.serialize();

            txin1.toApiJSON();
        } catch (e) {
            err = e;
        }

        expect(err).toBe(null);
    })
});

describe("TransactionOutput", () => {
    it("should throw no error if only scriptPublicKey and value is set", () => {
        let err: any = null;
        try {
            new TransactionOutput({
                value: 1090000,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).toBe(null);
    });

    it("should serialize value and scriptPublicKey", () => {
        const serial = new TransactionOutput({
            value: 1090000,
            scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
        }).serialize();

        const expectation = Buffer.from([
            0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0xa1, 0xd0,
            0x20, 0x11, 0xa7, 0x21, 0x5f, 0x66, 0x8e, 0x92,
            0x10, 0x13, 0xeb, 0x7a, 0xac, 0x9b, 0x7e, 0x64,
            0xb9, 0xec, 0x6e, 0x75, 0x7c, 0x1b, 0x64, 0x8e,
            0x89, 0x38, 0x8c, 0x91, 0x9f, 0x67, 0x6a, 0xa8,
            0x8c, 0xac,
        ]);
        
        expect(serial.equals(expectation)).toBeTruthy();
    });

    it("should throw errors if value is < 0 or > 0xFFFFFFFFFFFFFFFF", () => {
        let err: any = null;
        try {
            new TransactionOutput({
                value: 0,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);

        try {
            new TransactionOutput({
                value: 0xFFFFFFFFFFFFFFFF + 1,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });
        } catch (e) {
            err = e;
        }

        expect(err).not.toBe(null);
    });

    it("should allow for highest possible kaspa value", () => {
        let err: any = null;
        try {
            const output = new TransactionOutput({
                value: 18446744073709551615,
                scriptPublicKey: "2011a7215f668e921013eb7aac9b7e64b9ec6e757c1b648e89388c919f676aa88cac",
            });

            output.serialize();

            output.toApiJSON();
        } catch (e) {
            err = e;
        }

        expect(err).toBe(null);
    });
});
