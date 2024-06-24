import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { ContextLoader } from "../../shared/domain/ContextLoader";
import { TransactionContext } from "../../shared/model/TransactionContext";
import { TokenDataSource } from "../../token/data/TokenDataSource";
import { ClearSignContext } from "../../shared/model/ClearSignContext";
import { ExternalPluginDataSource } from "../data/ExternalPluginDataSource";

export class ExternalPluginContextLoader implements ContextLoader {
  private _externalPluginDataSource: ExternalPluginDataSource;
  private _tokenDataSource: TokenDataSource;

  constructor(
    externalPluginDataSource: ExternalPluginDataSource,
    tokenDataSource: TokenDataSource,
  ) {
    this._externalPluginDataSource = externalPluginDataSource;
    this._tokenDataSource = tokenDataSource;
  }

  async load(transaction: TransactionContext) {
    const response: ClearSignContext[] = [];

    if (!transaction.to || !transaction.data || transaction.data === "0x") {
      return [];
    }

    const selector = transaction.data.slice(0, 10) as `0x${string}`;

    const dappInfos = await this._externalPluginDataSource.getDappInfos({
      address: transaction.to,
      chainId: transaction.chainId,
      selector,
    });

    if (!dappInfos || dappInfos.selectorDetails.erc20OfInterest.length === 0) {
      return [];
    }

    const decodedCallData = this.getDecodedCallData(
      dappInfos.abi,
      dappInfos.selectorDetails.method,
      transaction.data,
    );

    const addresses: string[] = [];
    for (const erc20Path of dappInfos.selectorDetails.erc20OfInterest) {
      const address = this.getAddressFromPath(erc20Path, decodedCallData);
      addresses.push(address);
    }

    for (const address of addresses) {
      const tokenPayload = await this._tokenDataSource.getTokenInfosPayload({
        address,
        chainId: transaction.chainId,
      });

      if (tokenPayload) {
        response.push({ type: "provideERC20TokenInformation" as const, payload: tokenPayload });
      } else {
        response.push({
          type: "error",
          error: new Error(
            "[ContextModule] ExternalPluginContextLoader: Unable to get payload for token " +
              address,
          ),
        });
      }
    }

    response.push({
      type: "setExternalPlugin" as const,
      payload: Buffer.concat([
        Buffer.from(dappInfos.selectorDetails.serializedData, "hex"),
        Buffer.from(dappInfos.selectorDetails.signature, "hex"),
      ]).toString("hex"),
    });

    return response;
  }

  private getDecodedCallData(abi: object[], method: string, data: string) {
    try {
      const contractInterface = new Interface(abi);
      return contractInterface.decodeFunctionData(method, data);
    } catch (e) {
      throw new Error("[ContextModule] ExternalPluginContextLoader: Unable to parse abi");
    }
  }

  private getAddressFromPath(path: string, decodedCallData: ethers.utils.Result): `0x${string}` {
    // ethers.utils.Result is a record string, any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = decodedCallData;
    for (const key of path.split(".")) {
      // In Solidity, a struct cannot begin with a number
      // Additionally, when we use -1, it signifies the last element of the array.
      if (key === "-1") {
        value = value[value.length - 1];
      } else {
        value = value[key];
      }
    }

    if (typeof value !== "string" || !value.startsWith("0x")) {
      throw new Error("[ContextModule] ExternalPluginContextLoader: Unable to get address");
    }

    return value as `0x${string}`;
  }
}
