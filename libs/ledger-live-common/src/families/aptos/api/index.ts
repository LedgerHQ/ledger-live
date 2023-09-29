import { AptosClient, TxnBuilderTypes } from "aptos";
import type { Types as AptosTypes } from "aptos";
import BigNumber from "bignumber.js";
import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";

// import { isTestnet } from "../logic";
import type {
  AptosResource,
  AptosCoinStoreResource,
  AptosTransaction,
  Transaction,
} from "../types";
import { isUndefined } from "lodash";

const getApiEndpoint = (_: string) => getEnv("APTOS_TESTNET_API_ENDPOINT");
// TODO: uncomment before release
// const getApiEndpoint = (currencyId: string) =>
//   isTestnet(currencyId)
//     ? getEnv("APTOS_TESTNET_API_ENDPOINT")
//     : getEnv("APTOS_API_ENDPOINT");

export class AptosAPI {
  protected defaultEndpoint: string;
  private client: AptosClient;

  constructor(currencyId: string) {
    this.defaultEndpoint = getApiEndpoint(currencyId);
    this.client = new AptosClient(this.defaultEndpoint);
  }

  getAccount = async (address: string): Promise<AptosTypes.AccountData> => {
    return this.client.getAccount(address);
  };

  async getAccountInfo(address: string) {
    const [balance, transactions, blockHeight] = await Promise.all([
      this.getBalance(address),
      this.getTransactions(address),
      this.getHeight(),
    ]);

    const txs = await Promise.all(
      transactions.map(async tx => {
        tx.block = await this.getBlock(parseInt(tx.version));
        return tx;
      }),
    );

    return {
      balance,
      txs,
      blockHeight,
    };
  }

  async estimateGasPrice(): Promise<AptosTypes.GasEstimation> {
    return this.client.estimateGasPrice();
  }

  async generateTransaction(
    address: string,
    payload: AptosTypes.EntryFunctionPayload,
    options: Transaction["options"],
  ): Promise<TxnBuilderTypes.RawTransaction> {
    const opts: Partial<AptosTypes.SubmitTransactionRequest> = {};
    if (!isUndefined(options.maxGasAmount)) {
      opts.max_gas_amount = BigNumber(options.maxGasAmount).toString();
    }

    if (!isUndefined(options.gasUnitPrice)) {
      opts.gas_unit_price = BigNumber(options.gasUnitPrice).toString();
    }

    if (!isUndefined(options.sequenceNumber)) {
      opts.sequence_number = BigNumber(options.sequenceNumber).toString();
    }

    if (!isUndefined(options.expirationTimestampSecs)) {
      opts.expiration_timestamp_secs = BigNumber(options.expirationTimestampSecs).toString();
    }

    const tx = await this.client.generateTransaction(address, payload, opts);

    let serverTimestamp = tx.expiration_timestamp_secs;
    if (isUndefined(opts.expiration_timestamp_secs)) {
      try {
        const ts = (await this.client.getLedgerInfo()).ledger_timestamp;
        serverTimestamp = BigInt(Math.ceil(+ts / 1_000_000 + 2 * 60)); // in microseconds
      } catch (e) {
        // nothing
      }
    }

    const ntx = new TxnBuilderTypes.RawTransaction(
      tx.sender,
      tx.sequence_number,
      tx.payload,
      tx.max_gas_amount,
      tx.gas_unit_price,
      serverTimestamp,
      tx.chain_id,
    );

    return ntx;
  }

  async simulateTransaction(
    address: TxnBuilderTypes.Ed25519PublicKey,
    tx: TxnBuilderTypes.RawTransaction,
  ): Promise<AptosTypes.UserTransaction[]> {
    return this.client.simulateTransaction(address, tx, {
      estimateGasUnitPrice: true,
      estimateMaxGasAmount: true,
      estimatePrioritizedGasUnitPrice: false,
    });
  }

  async broadcast(signature: string): Promise<string> {
    const txBytes = Uint8Array.from(Buffer.from(signature, "hex"));
    const pendingTx = await this.client.submitTransaction(txBytes);
    return pendingTx.hash;
  }

  private async getTransactions(address: string): Promise<AptosTransaction[]> {
    try {
      const txs = await this.client.getAccountTransactions(address, {
        limit: 1000,
      });
      return txs as unknown as AptosTransaction[];
    } catch (e: any) {
      return [];
    }
  }

  private async getBalance(address: string): Promise<BigNumber> {
    try {
      const balanceRes = await this.client.getAccountResource(
        address,
        "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
      );
      const balance = (balanceRes as AptosResource<AptosCoinStoreResource>).data.coin.value;
      return new BigNumber(balance);
    } catch (e: any) {
      return new BigNumber(0);
    }
  }

  private async getHeight(): Promise<number> {
    const { data } = await network({
      method: "GET",
      url: this.defaultEndpoint,
    });
    return data.block_height;
  }

  private async getBlock(version: number) {
    const block = await this.client.getBlockByVersion(version);
    return {
      height: parseInt(block.block_height),
      hash: block.block_hash,
    };
  }
}
