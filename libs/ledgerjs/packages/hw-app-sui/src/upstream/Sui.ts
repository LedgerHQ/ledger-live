/// <reference types="node" />
// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { DeviceModelId } from '@ledgerhq/devices';
import { LatestFirmwareVersionRequired, UpdateYourApp } from '@ledgerhq/errors';
import { loadPKI } from '@ledgerhq/hw-bolos';
import Transport, { TransportStatusError } from '@ledgerhq/hw-transport';
import calService from '@ledgerhq/ledger-cal-service';
import sha256 from 'fast-sha256';
import semver from 'semver';

import type { DescriptorInput } from './descriptor.js';
import { buildDescriptor } from './descriptor.js';

export type GetPublicKeyResult = {
	publicKey: Uint8Array;
	address: Uint8Array;
};

export type SignTransactionResult = {
	signature: Uint8Array;
};

export type GetVersionResult = {
	major: number;
	minor: number;
	patch: number;
};

export type Resolution = {
	deviceModelId?: DeviceModelId | undefined;
	certificateSignatureKind?: 'prod' | 'test' | undefined;
	tokenAddress?: string;
	tokenId?: string;
};

export type AppConfig = {
	blindSigningEnabled: boolean;
	version: string;
};

enum LedgerToHost {
	RESULT_ACCUMULATING = 0,
	RESULT_FINAL = 1,
	GET_CHUNK = 2,
	PUT_CHUNK = 3,
}

enum HostToLedger {
	START = 0,
	GET_CHUNK_RESPONSE_SUCCESS = 1,
	GET_CHUNK_RESPONSE_FAILURE = 2,
	PUT_CHUNK_RESPONSE = 3,
	RESULT_ACCUMULATING_RESPONSE = 4,
}

const MIN_VERSION = '1.2.2';
const MANAGER_APP_NAME = 'Sui';

function isPKIUnsupportedError(err: unknown): err is TransportStatusError {
	return err instanceof TransportStatusError && err.message.includes('0x6a81');
}

async function tryLoadPKI(...args: Parameters<typeof loadPKI>) {
	try {
		await loadPKI(...args);
	} catch (err) {
		if (isPKIUnsupportedError(err)) {
			throw new LatestFirmwareVersionRequired('LatestFirmwareVersionRequired');
		}
	}
}

/**
 * Sui API
 *
 * @example
 * import Sui from "@mysten/ledgerjs-hw-app-sui";
 * const sui = new Sui(transport)
 */
export default class Sui {
	transport: Transport;
	readonly #verbose: boolean;

	constructor(transport: Transport, scrambleKey = 'default_sui_scramble_key', verbose = false) {
		this.#verbose = verbose;
		this.transport = transport;
		this.transport.decorateAppAPIMethods(
			this,
			['getPublicKey', 'signTransaction', 'getVersion', 'provideTrustedDynamicDescriptor'],
			scrambleKey,
		);
	}

	/**
	 * Retrieves the public key associated with a particular BIP32 path from the Ledger app.
	 *
	 * @param path - the path to retrieve.
	 * @param displayOnDevice - whether or not the address should be displayed on the device.
	 *
	 */
	async getPublicKey(path: string, displayOnDevice = false): Promise<GetPublicKeyResult> {
		const cla = 0x00;
		const ins = displayOnDevice ? 0x01 : 0x02;
		const p1 = 0;
		const p2 = 0;
		const payload = buildBip32KeyPayload(path);
		const response = await this.#sendChunks(cla, ins, p1, p2, payload);
		const keySize = response[0];

		const publicKey = response.slice(1, keySize + 1); // slice uses end index.
		let address: Uint8Array | null = null;
		if (response.length > keySize + 2) {
			const addressSize = response[keySize + 1];
			address = response.slice(keySize + 2, keySize + 2 + addressSize);
		}
		const res: GetPublicKeyResult = {
			publicKey: publicKey,
			address: address!,
		};
		return res;
	}

	/**
	 * Sign a transaction with the key at a BIP32 path.
	 *
	 * @param txn - The transaction bytes to sign.
	 * @param path - The path to use when signing the transaction.
	 * @param options - Additional options used for clear signing purposes.
	 * @param resolution - Additional data for token clear signing purposes.
	 */
	async signTransaction(
		path: string,
		txn: Uint8Array,
		options?: {
			bcsObjects: Uint8Array[];
		},
		resolution?: Resolution,
	): Promise<SignTransactionResult> {
		const cla = 0x00;
		const ins = 0x03;
		const p1 = 0;
		const p2 = 0;

		if (this.#verbose) this.#log(txn);

		// Transaction payload is the byte length as uint32le followed by the bytes
		const rawTxn = Buffer.from(txn);
		const hashSize = Buffer.alloc(4);
		hashSize.writeUInt32LE(rawTxn.length, 0);

		// Build transaction payload:
		const payloadTxn = Buffer.concat([hashSize, rawTxn]);
		this.#log('Payload Txn', payloadTxn);

		const bip32KeyPayload = buildBip32KeyPayload(path);
		const payloads = [payloadTxn, bip32KeyPayload];

		// The public getVersion is decorated with a lock in the constructor:
		const { major } = await this.#internalGetVersion();
		this.#log('App version', major);

		const bcsObjects = options?.bcsObjects ?? [];
		this.#log('Objects list length', bcsObjects.length);

		if (major > 0 && bcsObjects.length > 0) {
			// Build object list payload:
			const numItems = Buffer.alloc(4);
			numItems.writeUInt32LE(bcsObjects.length, 0);

			let listData = Buffer.from(numItems);

			// Add each item with its length prefix:
			for (const item of bcsObjects) {
				const rawItem = Buffer.from(item);
				const itemLen = Buffer.alloc(4);
				itemLen.writeUInt32LE(rawItem.length, 0);

				listData = Buffer.concat([listData, itemLen, rawItem]);
			}

			payloads.push(listData);
		}

		if (resolution) {
			if (!resolution.deviceModelId) {
				throw new Error('Resolution provided without a deviceModelId');
			}

			if (resolution.deviceModelId !== DeviceModelId.nanoS) {
				await this.#checkAppVersion(MIN_VERSION, { throwOnOutdated: true });

				const { descriptor, signature } = await calService.getCertificate(
					resolution.deviceModelId,
					'trusted_name',
					'latest',
					{ signatureKind: resolution.certificateSignatureKind },
				);

				try {
					await loadPKI(this.transport, 'TRUSTED_NAME', descriptor, signature);
				} catch (err) {
					if (isPKIUnsupportedError(err)) {
						throw new LatestFirmwareVersionRequired('LatestFirmwareVersionRequired');
					}
				}

				if (resolution.tokenId) {
					const { descriptor: coinMetaDescriptor, signature: coinMetaSignature } =
						await calService.getCertificate(resolution.deviceModelId, 'coin_meta', 'latest', {
							signatureKind: resolution.certificateSignatureKind,
						});

					await tryLoadPKI(this.transport, 'COIN_META', coinMetaDescriptor, coinMetaSignature);

					const token = await calService.findToken(
						{ id: resolution.tokenId },
						{ signatureKind: resolution.certificateSignatureKind },
					);

					await this.#provideTrustedDynamicDescriptor({
						data: Buffer.from(token.descriptor.data, 'hex'),
						signature: Buffer.from(token.descriptor.signature, 'hex'),
					});
				}
			}
		}

		// Send the chunks and return the signature
		const signature = await this.#sendChunks(cla, ins, p1, p2, payloads);
		return { signature };
	}

	/**
	 * Retrieve the app version on the attached Ledger device.
	 */
	async #checkAppVersion(minVersion: string, { throwOnOutdated }: { throwOnOutdated: boolean }) {
		const { major, minor, patch } = await this.#internalGetVersion();
		const outdated = semver.lt(`${major}.${minor}.${patch}`, minVersion);

		if (outdated && throwOnOutdated) {
			throw new UpdateYourApp(undefined, {
				managerAppName: MANAGER_APP_NAME,
			});
		}
	}

	/**
	 * Retrieve the app version on the attached Ledger device.
	 */
	async getVersion(): Promise<GetVersionResult> {
		return await this.#internalGetVersion();
	}

	async #internalGetVersion() {
		const [major, minor, patch] = await this.#sendChunks(0x00, 0x00, 0x00, 0x00, Buffer.alloc(1));
		return {
			major,
			minor,
			patch,
		};
	}

	/**
	 * Provides trusted dynamic and signed coin metadata
	 *
	 * @param data An object containing the descriptor and its signature from the CAL
	 */
	async #provideTrustedDynamicDescriptor(data: DescriptorInput): Promise<boolean> {
		await this.#sendChunks(
			0x00, // CLA
			0x22, // Provide trusted dynamic descriptor
			0x00, // P1
			0x00, // P2
			buildDescriptor(data),
		);

		return true;
	}

	/**
	 * Convert a raw payload into what is essentially a singly-linked list of chunks, which
	 * allows the ledger to re-seek the data in a secure fashion.
	 */
	async #sendChunks(
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		payload: Buffer | Buffer[],
		// Constant (protocol dependent) data that the ledger may want to refer to
		// besides the payload.
		extraData: Map<string, Buffer> = new Map<string, Buffer>(),
	): Promise<Buffer> {
		const chunkSize = 180;
		if (!(payload instanceof Array)) {
			payload = [payload];
		}
		const parameterList: Buffer[] = [];
		let data = new Map<string, Buffer>(extraData);
		for (let j = 0; j < payload.length; j++) {
			const chunkList: Buffer[] = [];
			for (let i = 0; i < payload[j].length; i += chunkSize) {
				const cur = payload[j].slice(i, i + chunkSize);
				chunkList.push(cur);
			}
			// Store the hash that points to the "rest of the list of chunks"
			let lastHash = Buffer.alloc(32);
			this.#log(lastHash);
			// Since we are doing a foldr, we process the last chunk first
			// We have to do it this way, because a block knows the hash of
			// the next block.
			data = chunkList.reduceRight((blocks, chunk) => {
				const linkedChunk = Buffer.concat([lastHash, chunk]);
				this.#log('Chunk: ', chunk);
				this.#log('linkedChunk: ', linkedChunk);
				lastHash = Buffer.from(sha256(linkedChunk));
				blocks.set(lastHash.toString('hex'), linkedChunk);
				return blocks;
			}, data);
			parameterList.push(lastHash);
			lastHash = Buffer.alloc(32);
		}
		this.#log(data);
		return await this.#handleBlocksProtocol(
			cla,
			ins,
			p1,
			p2,
			Buffer.concat(([Buffer.from([HostToLedger.START])] as Buffer[]).concat(parameterList)),
			data,
		);
	}

	async #handleBlocksProtocol(
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		initialPayload: Buffer,
		data: Map<string, Buffer>,
	): Promise<Buffer> {
		let payload = initialPayload;
		let result = Buffer.alloc(0);
		do {
			this.#log('Sending payload to ledger: ', payload.toString('hex'));
			const rv = await this.transport.send(cla, ins, p1, p2, payload);
			this.#log('Received response: ', rv);
			var rv_instruction = rv[0];
			const rv_payload = rv.slice(1, rv.length - 2); // Last two bytes are a return code.
			if (!(rv_instruction in LedgerToHost)) {
				throw new TypeError('Unknown instruction returned from ledger');
			}
			switch (rv_instruction) {
				case LedgerToHost.RESULT_ACCUMULATING:
				case LedgerToHost.RESULT_FINAL:
					result = Buffer.concat([result, rv_payload]);
					// Won't actually send this if we drop out of the loop for RESULT_FINAL
					payload = Buffer.from([HostToLedger.RESULT_ACCUMULATING_RESPONSE]);
					break;
				case LedgerToHost.GET_CHUNK:
					const chunk = data.get(rv_payload.toString('hex'));
					this.#log('Getting block ', rv_payload);
					this.#log('Found block ', chunk);
					if (chunk) {
						payload = Buffer.concat([
							Buffer.from([HostToLedger.GET_CHUNK_RESPONSE_SUCCESS]),
							chunk,
						]);
					} else {
						payload = Buffer.from([HostToLedger.GET_CHUNK_RESPONSE_FAILURE]);
					}
					break;
				case LedgerToHost.PUT_CHUNK:
					data.set(Buffer.from(sha256(rv_payload)).toString('hex'), rv_payload);
					payload = Buffer.from([HostToLedger.PUT_CHUNK_RESPONSE]);
					break;
			}
		} while (rv_instruction !== LedgerToHost.RESULT_FINAL);
		return result;
	}

	#log(...args: any[]) {
		if (this.#verbose) console.log(args);
	}
}

function buildBip32KeyPayload(path: string): Buffer {
	const paths = splitPath(path);
	// Bip32Key payload is:
	// 1 byte with number of elements in u32 array path
	// Followed by the u32 array itself
	const payload = Buffer.alloc(1 + paths.length * 4);
	payload[0] = paths.length;
	paths.forEach((element, index) => {
		payload.writeUInt32LE(element, 1 + 4 * index);
	});
	return payload;
}

// TODO use bip32-path library
function splitPath(path: string): number[] {
	const result: number[] = [];
	const components = path.split('/');
	components.forEach((element) => {
		let number = parseInt(element, 10);

		if (isNaN(number)) {
			return; // FIXME shouldn't it throws instead?
		}

		if (element.length > 1 && element[element.length - 1] === "'") {
			number += 0x80000000;
		}

		result.push(number);
	});
	return result;
}
