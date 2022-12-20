import type { ZilliqaResourcesRaw, ZilliqaResources } from "./types";
import Long from "long";

export function toZilliqaResourcesRaw(
	r: ZilliqaResources
): ZilliqaResourcesRaw {
	console.log("ZILLIQA: toZilliqaResourcesRaw.");
	const { nonce, publicKey } = r;
	return {
		nonce,
		publicKey,
	};
}

export function fromZilliqaResourcesRaw(
	r: ZilliqaResourcesRaw
): ZilliqaResources {
	console.log("ZILLIQA: fromZilliqaResourcesRaw.");
	const { nonce, publicKey } = r;
	return {
		nonce,
		publicKey,
	};
}
