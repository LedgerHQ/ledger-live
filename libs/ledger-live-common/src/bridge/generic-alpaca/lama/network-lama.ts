import type {
  Balance,
  Block,
  BlockInfo,
  Operation,
  FeeEstimation,
  Pagination,
  TransactionIntent,
  TransactionValidation,
  Api,
  AssetInfo,
  Cursor,
  Page,
  Stake,
  Reward,
} from "@ledgerhq/coin-framework/api/index";
import network from "@ledgerhq/live-network";

function adaptOp<T extends AssetInfo>(backendOp: Operation<T>): Operation<T> {
  const { date } = backendOp.tx;
  const newDate = new Date(date);

  return {
    ...backendOp,
    value: BigInt(backendOp.value),
    tx: { ...backendOp.tx, fees: BigInt(backendOp.tx.fees), date: newDate },
  };
}

const LAMA_URL = "https://lama-adapter.aws.stg.ldg-tech.com";

const accoundIdCache: Record<string, Record<string, string>> = {};

const getLamaId = (networkFamily: string): string => {
  const familyToLamaId: Record<string, string> = {
    xrp: "ripple",
  };
  if (familyToLamaId[networkFamily] === undefined) {
    throw new Error(`Unsupported network family: ${networkFamily}`);
  } else {
    return familyToLamaId[networkFamily];
  }
};

const getAccountId = async (
  networkFamily: string,
  address: string,
  pubKey: string,
): Promise<string> => {
  const lamaId = getLamaId(networkFamily);
  if (!accoundIdCache[lamaId]) {
    accoundIdCache[lamaId] = {};
  }
  if (!accoundIdCache[lamaId][address]) {
    const { data } = await network<
      { uid: string; network: string; address: "string" },
      {
        uid: string;
        // looks like it's not used but on swagger
        pub_key: string;
        x_pub: string;
        derivationCurve: Record<string, unknown>;
        expectedAddress: string;
      }
    >({
      method: "POST",
      url: `${LAMA_URL}/v1/${lamaId}/account`,
      data: {
        uid: address,
        pub_key: pubKey,
        x_pub: pubKey,
        derivationCurve: {},
        expectedAddress: address,
      },
    });
    accoundIdCache[lamaId][address] = data.uid;
  }
  return accoundIdCache[lamaId][address];
};

const withAccountId = async <T>(
  networkFamily: string,
  address: string,
  pubKey: string,
  callback: (accountId: string) => Promise<T>,
): Promise<T> => {
  const accountId = await getAccountId(networkFamily, address, pubKey);
  return callback(accountId);
};

const buildBroadcast = (networkFamily, accountId) =>
  async function broadcast(signedOperation: string): Promise<string> {
    const { data } = await network<
      {
        transaction_identifier: string;
      },
      {
        raw_transaction: string;
      }
    >({
      method: "POST",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/crafter/broadcast`,
      data: {
        raw_transaction: signedOperation,
      },
    });
    return data.transaction_identifier;
  };

const buildCombine = (networkFamily, accountId) =>
  async function combine(tx: string, signature: string, pubKey?: string): Promise<string> {
    const { data } = await network<
      {
        raw: string;
      },
      {
        raw_transaction: string;
        signature: string;
        pubkey?: string;
      }
    >({
      method: "POST",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/crafter/combine`,
      data: {
        raw_transaction: tx,
        signature: signature,
        pubkey: pubKey,
      },
    });
    return data.raw;
  };

const buildEstimateFees = (networkFamily, accountId) =>
  async function estimateFees(intent: TransactionIntent<any>): Promise<FeeEstimation> {
    const { data } = await network<{ fee: string }, unknown>({
      method: "POST",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/crafter/estimate`,
      data: {
        intent: {
          to: intent.recipient,
          amount: intent.amount.toString(10),
        },
      },
    });
    return {
      value: BigInt(data.fee),
    };
  };

const buildValidateIntent = networkFamily =>
  async function validateIntent(
    transaction: TransactionIntent<any>,
  ): Promise<TransactionValidation> {
    return Promise.resolve({
      warnings: {},
      errors: {},
      estimatedFees: BigInt(0),
      amount: transaction.amount,
      totalSpent: transaction.amount,
    });
  };

const buildGetBalance = (networkFamily: string, accountId: string) =>
  async function getBalance(address: string): Promise<Balance[]> {
    const { data } = await network<
      { asset: { type: string; issuer: string }; amount: string }[],
      unknown
    >({
      method: "GET",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/balance`,
    });

    return data.map(item => ({
      value: BigInt(item.amount),
      asset: {
        type: item.asset.type,
        assetOwner: item.asset.issuer,
      },
    }));
  };

const buildGetSequence = (networkFamily: string) =>
  async function getSequence(address: string): Promise<number> {
    const { data } = await network<number, unknown>({
      method: "GET",
      url: `${LAMA_URL}/${getLamaId(networkFamily)}/account/${address}/info`,
    });

    return data;
  };

const buildListOperations = (networkFamily, accountId) =>
  async function listOperations(
    address: string,
    pagination: Pagination = { minHeight: 0 },
  ): Promise<[Operation<any>[], string]> {
    const { data } = await network<{ operations: Operation<any>[] }, unknown>({
      method: "GET",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/operations`,
      data: {
        from: pagination.minHeight,
      },
    });
    return [data.operations.map(op => adaptOp(op)), ""];
  };

const buildLastBlock = networkFamily =>
  async function lastBlock(): Promise<BlockInfo> {
    const { data } = await network<{ height: number; hash: string; time: string }, undefined>({
      method: "GET",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/block/current`,
    });
    return {
      height: data.height,
      time: new Date(data.time),
      hash: data.hash,
    };
  };

const buildCraftTransaction = (networkFamily, accountId) =>
  async function craftTransaction(intent: TransactionIntent<any>): Promise<string> {
    const { data } = await network<any, unknown>({
      method: "POST",
      url: `${LAMA_URL}/v1/${getLamaId(networkFamily)}/account/${accountId}/encode`,
      data: {
        intent: {
          to: intent.recipient,
          amount: intent.amount.toString(10),
        },
      },
    });
    return data.rawTransaction;
  };

export const getNetworkLamaApi = (networkFamily: string, address: string, pubKey: string) =>
  ({
    broadcast: signedOperation =>
      withAccountId<string>(networkFamily, address, pubKey, async accountId =>
        buildBroadcast(networkFamily, accountId)(signedOperation),
      ),
    combine: (tx, signature, pubkey) =>
      withAccountId<string>(networkFamily, address, pubKey, async accountId =>
        buildCombine(networkFamily, accountId)(tx, signature, pubkey),
      ),
    validateIntent: () =>
      Promise.resolve({
        warnings: {},
        errors: {},
        estimatedFees: BigInt(0),
        amount: BigInt(0),
        totalSpent: BigInt(0),
      }),
    estimateFees: transactionIntent =>
      withAccountId<FeeEstimation>(networkFamily, address, pubKey, async accountId =>
        buildEstimateFees(networkFamily, accountId)(transactionIntent),
      ),
    getBalance: address =>
      withAccountId<Balance[]>(networkFamily, address, pubKey, async accountId =>
        buildGetBalance(networkFamily, accountId)(address),
      ),
    getSequence: () => Promise.resolve(0),
    listOperations: (address: string, pagination?: Pagination) =>
      withAccountId<[Operation<any>[], string]>(networkFamily, address, pubKey, async accountId =>
        buildListOperations(networkFamily, accountId)(address, pagination),
      ),
    lastBlock: buildLastBlock(networkFamily),
    craftTransaction: transactionIntent =>
      withAccountId<string>(networkFamily, address, pubKey, async accountId =>
        buildCraftTransaction(networkFamily, accountId)(transactionIntent),
      ),
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
  }) satisfies Api<any>;
