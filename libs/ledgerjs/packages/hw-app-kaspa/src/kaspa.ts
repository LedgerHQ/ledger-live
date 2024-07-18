import Transport from "@ledgerhq/hw-transport";
import { StatusCodes } from "@ledgerhq/errors";

import { Transaction } from "./transaction";

const BIP32Path = require("bip32-path");

// Get Address
const P1_NON_CONFIRM = 0x00;
const P1_CONFIRM = 0x01;

// Sign Transaction
const P1_HEADER = 0x00;
const P1_OUTPUTS = 0x01;
const P1_INPUTS = 0x02;
const P1_NEXT_SIGNATURE = 0x03;

const P2_LAST = 0x00;
const P2_MORE = 0x80;

const LEDGER_CLA = 0xe0;

const INS = {
    GET_VERSION: 0x04,
    GET_ADDRESS: 0x05,
    SIGN_TX: 0x06,
    SIGN_MESSAGE: 0x07,
};

function pathToBuffer(originalPath) {
    const pathNums = BIP32Path.fromString(originalPath).toPathArray();
    return serializePath(pathNums);
}

function serializePath(path) {
    const buf = Buffer.alloc(1 + path.length * 4);
    buf.writeUInt8(path.length, 0);
    for (const [i, num] of path.entries()) {
        buf.writeUInt32BE(num, 1 + i * 4);
    }
    return buf;
}

class Kaspa {
    /**
     * @type {Transport}
     */
    transport: Transport;

    constructor(transport: Transport) {
        this.transport = transport;
        this.transport.decorateAppAPIMethods(this, [
            "getVersion",
            "getAddress",
            "signTransaction",
        ], "");
    }

    /**
     * Get Kaspa address (public key) for a BIP32 path.
     *
     * @param {string} path a BIP32 path
     * @param {boolean} display flag to show display
     * @returns {Buffer} an object with the address field
     *
     * @example
     * kaspa.getPublicKey("44'/111111'/0'").then(r => r.address)
     */
    async getPublicKey(path, display: boolean = false): Promise<Buffer> {
        const pathBuffer = pathToBuffer(path);

        const p1 = display ? P1_CONFIRM : P1_NON_CONFIRM;

        const publicKeyBuffer = await this.sendToDevice(INS.GET_ADDRESS, p1, pathBuffer);

        return publicKeyBuffer;
    }

    /**
     * Sign a Kaspa transaction. Applies the signatures into the input objects
     *
     * @param {Transaction} transaction - the Transaction object
     *
     *
     * @example
     * kaspa.signTransaction(transaction)
     */
    async signTransaction(transaction: Transaction): Promise<void> {
        const header = transaction.serialize();

        await this.sendToDevice(INS.SIGN_TX, P1_HEADER, header, P2_MORE);

        for (const output of transaction.outputs) {
            await this.sendToDevice(INS.SIGN_TX, P1_OUTPUTS, output.serialize(), P2_MORE);
        }

        let signatureBuffer: Buffer | null = null;

        for (let i = 0; i < transaction.inputs.length; i++) {
            let p2 = i >= transaction.inputs.length - 1 ? P2_LAST : P2_MORE;
            const input = transaction.inputs[i];
            signatureBuffer = await this.sendToDevice(INS.SIGN_TX, P1_INPUTS, input.serialize(), p2);
        }

        while (signatureBuffer) {
            const [hasMore, inputIndex, sigLen, ...signatureAndSighash] = signatureBuffer;
            const sigBuf = signatureAndSighash.slice(0, sigLen);
            const sighashLen = signatureAndSighash[64];
            const sighashBuf = signatureAndSighash.slice(65, 65 + sighashLen);

            if (sigLen != 64) {
                throw new Error(`Expected signature length is 64. Received ${sigLen} for input ${inputIndex}`);
            }

            if (sighashLen != 32) {
                throw new Error(`Expected sighash length is 32. Received ${sighashLen} for input ${inputIndex}`)
            }

            transaction.inputs[inputIndex].setSignature(Buffer.from(sigBuf).toString("hex"));
            transaction.inputs[inputIndex].setSighash(Buffer.from(sighashBuf).toString("hex"));

            // Keep going as long as hasMore is true-ish
            if (!hasMore) {
                break;
            }

            signatureBuffer = await this.sendToDevice(INS.SIGN_TX, P1_NEXT_SIGNATURE);
        }
    }

    /**
     * Sign personal message on the device
     * @param {String} message - the personal message string to sign. Max 120 len for Nano S, 200 len for others
     * @param {0|1} addressType
     * @param {number} addressIndex
     * 
     * @returns {Buffer} application config object
     *
     * @example
     * kaspa.signMessage(message).then(r => r.version)
     */
    async signMessage(message: string, addressType?: 0|1, addressIndex?: number, account?: number) {
        account = account ?? 0x80000000;
        addressIndex = addressIndex ?? 0;
        addressType = addressType ?? 0;

        if (account < 0x80000000 || account > 0xFFFFFFFF) {
            throw new Error('Account must be between 0x80000000 and 0xFFFFFFFF');
        }

        if (addressIndex < 0 || addressIndex > 0xFFFFFFFF) {
            throw new Error('Address index must be an integer in range [0, 0xFFFFFFFF]');
        }

        const addressTypeBuf = Buffer.alloc(1);
        addressTypeBuf.writeUInt8(addressType || 0);

        const addressIndexBuf = Buffer.alloc(4);
        addressIndexBuf.writeUInt32BE(addressIndex || 0);

        const accountBuf = Buffer.alloc(4);
        accountBuf.writeUInt32BE(account);

        const messageBuffer = Buffer.from(message);
        const messageLenBuf = Buffer.alloc(1);
        messageLenBuf.writeUInt8(messageBuffer.length);

        const payload = Buffer.concat([
            addressTypeBuf,
            addressIndexBuf,
            accountBuf,
            messageLenBuf,
            messageBuffer,
        ]);

        const signatureBuffer = await this.sendToDevice(INS.SIGN_MESSAGE, P1_NON_CONFIRM, payload);
        const [sigLen, ...signatureAndMessageHash] = signatureBuffer;
        const signature = Buffer.from(signatureAndMessageHash.slice(0, sigLen)).toString('hex');
        const messageHashLen = signatureAndMessageHash[64];
        const messageHash = Buffer.from(signatureAndMessageHash.slice(65, 65 + messageHashLen)).toString('hex');

        return { signature, messageHash };
    }

    /**
     * Get application configuration.
     *
     * @returns {Buffer} application config object
     *
     * @example
     * kaspa.getVersion().then(r => r.version)
     */
    async getVersion() {
        const [major, minor, patch] = await this.sendToDevice(INS.GET_VERSION, P1_NON_CONFIRM);

        return { version: `${major}.${minor}.${patch}` };
    }
    
    async sendToDevice(instruction, p1, payload = Buffer.alloc(0), p2 = P2_LAST) {
        const acceptStatusList = [StatusCodes.OK];

        const reply = await this.transport.send(
            LEDGER_CLA,
            instruction,
            p1,
            p2,
            payload,
            acceptStatusList
        );
    
        return reply.subarray(0, reply.length - 2);
    }
}

export default Kaspa;
