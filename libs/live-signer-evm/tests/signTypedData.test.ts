import { of } from "rxjs";
import { createSignTypedData, toEIP712Message } from "../src/confidential/signTypedData";
import type { EvmSignerEvent } from "../src/types";

// Shape of the user-decrypt permit the confidential-token SDK produces (values shortened)
const permit = {
  domain: {
    name: "Decryption",
    version: "1",
    chainId: 11155111n,
    verifyingContract: "0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478",
  },
  types: {
    UserDecryptRequestVerification: [
      { name: "publicKey", type: "bytes" },
      { name: "contractAddresses", type: "address[]" },
      { name: "startTimestamp", type: "uint256" },
      { name: "durationDays", type: "uint256" },
      { name: "extraData", type: "bytes" },
    ],
  },
  primaryType: "UserDecryptRequestVerification",
  message: {
    publicKey: "0x2000",
    contractAddresses: ["0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639"],
    startTimestamp: 1791382020n,
    durationDays: "30",
    extraData: "0x00",
  },
};

describe("toEIP712Message", () => {
  it("turns bigints into decimal strings and the chain id into a number", () => {
    const message = toEIP712Message(permit);
    expect(message.domain.chainId).toBe(11155111);
    expect(message.message.startTimestamp).toBe("1791382020");
    expect(message.message.durationDays).toBe("30");
  });

  it("derives the EIP712Domain type from the domain when the SDK leaves it out", () => {
    expect(toEIP712Message(permit).types.EIP712Domain).toEqual([
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ]);
  });

  it("keeps an EIP712Domain type the SDK provides", () => {
    const declared = [{ name: "name", type: "string" }];
    const message = toEIP712Message({
      ...permit,
      types: { ...permit.types, EIP712Domain: declared },
    });
    expect(message.types.EIP712Domain).toEqual(declared);
  });
});

describe("createSignTypedData", () => {
  it("signs on the device and returns 0x + r + s + v", async () => {
    const events: EvmSignerEvent[] = [
      { type: "signer.evm.loading-context" },
      { type: "signer.evm.signing" },
      { type: "signer.evm.signed", value: { r: "11".repeat(32), s: "22".repeat(32), v: 27 } },
    ];
    const signEIP712Message = jest.fn(() => of(...events));

    const signature = await createSignTypedData({ signEIP712Message }, "44'/60'/0'/0/0")(permit);

    expect(signEIP712Message).toHaveBeenCalledWith("44'/60'/0'/0/0", toEIP712Message(permit));
    expect(signature).toBe(`0x${"11".repeat(32)}${"22".repeat(32)}1b`);
  });

  it("propagates a refusal on the device", async () => {
    const refused = jest.fn(
      () =>
        new (jest.requireActual("rxjs").Observable)((observer: { error(e: Error): void }) =>
          observer.error(new Error("UserRefusedOnDevice")),
        ),
    );
    await expect(
      createSignTypedData({ signEIP712Message: refused }, "44'/60'/0'/0/0")(permit),
    ).rejects.toThrow("UserRefusedOnDevice");
  });
});
