import network from "../../../network";
import {
  HASH_TRANSACTION,
  METACHAIN_SHARD,
  TRANSACTIONS_SIZE,
} from "../constants";
export default class ElrondApi {
  private API_URL: string;

  constructor(API_URL: string) {
    this.API_URL = API_URL;
  }

  async getAccountDetails(addr: string) {
    const {
      data: { balance, nonce },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}`,
    });
    return {
      balance,
      nonce,
    };
  }

  async getValidators() {
    let data = [];

    try {
      const {
        data: { validators },
      } = await network({
        method: "GET",
        url: `${this.API_URL}/validator/statistics`,
      });
      data = validators;
    } catch (error) {
      return data;
    }

    return data;
  }

  async getNetworkConfig() {
    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            erd_denomination: denomination,
            erd_min_gas_limit: gasLimit,
            erd_min_gas_price: gasPrice,
            erd_gas_per_data_byte: gasPerByte,
          },
        },
      },
    } = await network({
      method: "GET",
      url: `${this.API_URL}/network/config`,
    });
    return {
      chainId,
      denomination,
      gasLimit,
      gasPrice,
      gasPerByte,
    };
  }

  async submit({ operation, signature }) {
    const { chainId, gasLimit, gasPrice } = await this.getNetworkConfig();
    const {
      senders: [sender],
      recipients: [receiver],
      value,
      transactionSequenceNumber: nonce,
    } = operation;
    const {
      data: {
        data: { txHash: hash },
      },
    } = await network({
      method: "POST",
      url: `${this.API_URL}/transaction/send`,
      data: {
        nonce,
        value,
        receiver,
        sender,
        gasPrice,
        gasLimit,
        chainID: chainId,
        signature,
        ...HASH_TRANSACTION,
      },
    });
    return {
      hash,
    };
  }

  async getHistory(addr: string, startAt: number) {
    const { data: transactionsCount } = await network({
      method: "GET",
      url: `${this.API_URL}/transactions/count?condition=should&sender=${addr}&receiver=${addr}&after=${startAt}`,
    });

    let allTransactions: any[] = [];
    let from = 0;
    while (from <= transactionsCount) {
      const { data: transactions } = await network({
        method: "GET",
        url: `${this.API_URL}/transactions?condition=should&sender=${addr}&receiver=${addr}&after=${startAt}&from=${from}&size=${TRANSACTIONS_SIZE}`,
      });

      allTransactions = [...allTransactions, ...transactions];

      from = from + TRANSACTIONS_SIZE;
    }

    return allTransactions;
  }

  async getBlockchainBlockHeight() {
    const {
      data: [{ round: blockHeight }],
    } = await network({
      method: "GET",
      url: `${this.API_URL}/blocks?shard=${METACHAIN_SHARD}&fields=round`,
    });
    return blockHeight;
  }
}
