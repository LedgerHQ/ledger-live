import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { isEIP712Message } from "@ledgerhq/evm-tools/message/EIP712/index";
import { Account, AnyMessage, DeviceId, TypedEvmMessage } from "@ledgerhq/types-live";
import { ethers } from "ethers";
import { EvmSignature, EvmSigner, EvmSignerEvent } from "./types/signer";

export const prepareMessageToSign = ({ message }: { message: string }): TypedEvmMessage => {
  const parsedMessage = ((): string | Record<string, unknown> => {
    try {
      return JSON.parse(message) as Record<string, unknown>;
    } catch {
      return message;
    }
  })();

  if (isEIP712Message(parsedMessage)) {
    // With the ethers lib, EIP712Domain type should be removed otherwise
    // you'll end up with a "ambiguous primary types" error
    const { EIP712Domain, ...otherTypes } = parsedMessage.types;
    return {
      standard: "EIP712",
      message: parsedMessage,
      domainHash: ethers.TypedDataEncoder.hashDomain(parsedMessage.domain),
      hashStruct: ethers.TypedDataEncoder.hashStruct(
        parsedMessage.primaryType,
        otherTypes,
        parsedMessage.message,
      ),
    };
  }

  return {
    standard: "EIP191",
    message,
  };
};

export const signMessage =
  (signerContext: SignerContext<EvmSigner>) =>
  async (
    deviceId: DeviceId,
    account: Account,
    messageOpts: AnyMessage,
  ): Promise<{
    rsv: { r: string; s: string; v: string | number };
    signature: string;
  }> => {
    if (messageOpts.standard === "EIP191") {
      const { r, s, v } = await signerContext(deviceId, signer => {
        return new Promise<EvmSignature>((resolve, reject) => {
          signer
            .signPersonalMessage(
              account.freshAddressPath,
              Buffer.from(messageOpts.message).toString("hex"),
            )
            .subscribe({
              next: (event: EvmSignerEvent) => {
                if (event.type === "signer.evm.signed") {
                  resolve(event.value);
                }
              },
              error: reject,
            });
        });
      });

      const signature = ethers.Signature.from({
        r: `0x${r}`,
        s: `0x${s}`,
        v: typeof v === "string" ? parseInt(v, 16) : v,
      }).serialized;

      return { rsv: { r, s, v }, signature };
    }

    if (messageOpts.standard !== "EIP712") {
      throw new Error("Unsupported message standard");
    }

    const { r, s, v } = await signerContext(deviceId, async signer => {
      try {
        return await new Promise<EvmSignature>((resolve, reject) => {
          signer.signEIP712Message(account.freshAddressPath, messageOpts.message).subscribe({
            next: (event: EvmSignerEvent) => {
              if (event.type === "signer.evm.signed") {
                resolve(event.value);
              }
            },
            error: reject,
          });
        });
      } catch (e) {
        if (e instanceof Error && "statusText" in e && e.statusText === "INS_NOT_SUPPORTED") {
          return await new Promise<EvmSignature>((resolve, reject) => {
            signer
              .signEIP712HashedMessage(
                account.freshAddressPath,
                messageOpts.domainHash,
                messageOpts.hashStruct,
              )
              .subscribe({
                next: (event: EvmSignerEvent) => {
                  if (event.type === "signer.evm.signed") {
                    resolve(event.value);
                  }
                },
                error: reject,
              });
          });
        }
        throw e;
      }
    });

    const signature = ethers.Signature.from({
      r: `0x${r}`,
      s: `0x${s}`,
      v: typeof v === "string" ? parseInt(v, 16) : v,
    }).serialized;

    return { rsv: { r, s, v }, signature };
  };
