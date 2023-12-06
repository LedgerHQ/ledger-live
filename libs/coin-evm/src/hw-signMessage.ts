import { ethers } from "ethers";
import { getEnv } from "@ledgerhq/live-env";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { LoadConfig } from "@ledgerhq/hw-app-eth/lib/services/types";
import { isEIP712Message } from "@ledgerhq/evm-tools/message/EIP712/index";
import { Account, AnyMessage, DeviceId, TypedEvmMessage } from "@ledgerhq/types-live";
import { EvmSignature, EvmSigner } from "./signer";

export const prepareMessageToSign = ({ message }: { message: string }): TypedEvmMessage => {
  const parsedMessage = ((): string | Record<string, unknown> => {
    try {
      return JSON.parse(message) as Record<string, unknown>;
    } catch (error) {
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
      domainHash: ethers.utils._TypedDataEncoder.hashDomain(parsedMessage.domain),
      hashStruct: ethers.utils._TypedDataEncoder.hashStruct(
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
  (signerContext: SignerContext<EvmSigner, EvmSignature>) =>
  async (
    deviceId: DeviceId,
    account: Account,
    messageOpts: AnyMessage,
  ): Promise<{
    rsv: { r: string; s: string; v: string | number };
    signature: string;
  }> => {
    const loadConfig: LoadConfig = {
      cryptoassetsBaseURL: getEnv("DYNAMIC_CAL_BASE_URL"),
      nftExplorerBaseURL: getEnv("NFT_ETH_METADATA_SERVICE") + "/v1/ethereum",
    };

    if (messageOpts.standard === "EIP191") {
      const { r, s, v } = await signerContext(deviceId, signer => {
        signer.setLoadConfig(loadConfig);
        return signer.signPersonalMessage(
          account.freshAddressPath,
          Buffer.from(messageOpts.message).toString("hex"),
        );
      });

      const signature = ethers.utils.joinSignature({
        r: `0x${r}`,
        s: `0x${s}`,
        v: typeof v === "string" ? parseInt(v, 16) : v,
      });

      return { rsv: { r, s, v }, signature };
    }

    if (messageOpts.standard === "EIP712") {
      const { r, s, v } = await signerContext(deviceId, async signer => {
        signer.setLoadConfig(loadConfig);

        try {
          return await signer.signEIP712Message(account.freshAddressPath, messageOpts.message);
        } catch (e) {
          if (e instanceof Error && "statusText" in e && e.statusText === "INS_NOT_SUPPORTED") {
            return await signer.signEIP712HashedMessage(
              account.freshAddressPath,
              messageOpts.domainHash,
              messageOpts.hashStruct,
            );
          }
          throw e;
        }
      });

      const signature = ethers.utils.joinSignature({
        r: `0x${r}`,
        s: `0x${s}`,
        v: typeof v === "string" ? parseInt(v, 16) : v,
      });

      return { rsv: { r, s, v }, signature };
    }

    throw new Error("Unsupported message standard");
  };
