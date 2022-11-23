import Zilliqa from "@ledgerhq/hw-app-zilliqa";
import { log } from "@ledgerhq/logs";

import type { SignMessage, Result } from "../../hw/signMessage/types";
const signMessage: SignMessage = async (
	transport,
	{ path, message }
): Promise<Result> => {
	log("debug", "start signMessage process");

	const zilliqa = new Zilliqa(transport);

	if (!message) {
		throw new Error(`Message cannot be empty`);
	}

	const r = await zilliqa.signMessage(path, message as string);

	if (r.signature === null) {
		throw new Error("Failed to sign.");
	}

	return {
		rsv: {
			r: r.signature.slice(0, 32).toString("hex"),
			s: r.signature.slice(32, 64).toString("hex"),
			v: parseInt(r.signature.slice(64, 65).toString("hex"), 16),
		},
		signature: `0x${r.signature.toString("hex")}`,
	};
};

export default { signMessage };
