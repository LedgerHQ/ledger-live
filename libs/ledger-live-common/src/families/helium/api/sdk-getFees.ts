import Address from "@helium/address";
import {
  Transaction,
  PaymentV2,
  PaymentV1,
  StakeValidatorV1,
  UnstakeValidatorV1,
  TransferValidatorStakeV1,
  TokenBurnV1,
} from "@helium/transactions";
import { CryptoCurrency } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { endpointByCurrencyId } from "../utils";
import { fetch } from "./sdk";

const EMPTY_ADDRESS = Address.fromB58(
  "13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn"
);

const TXN_VARS: string[] = [
  "txn_fee_multiplier",
  "dc_payload_size",
  "staking_fee_txn_assert_location_v1",
  "staking_fee_txn_add_gateway_v1",
];

/**
 * Make fee transaction for PaymentV1 or PaymentV2.
 * @param type type of helium payment. payment_v1 | payment_v2
 * @returns Payment object.
 */
const makeFeeTxn = (type = "payment_v2") => {
  switch (type) {
    case "payment_v1":
      return new PaymentV1({
        payer: EMPTY_ADDRESS,
        payee: EMPTY_ADDRESS,
        amount: 100000000,
        nonce: 1,
      });
    case "payment_v2":
      return new PaymentV2({
        payer: EMPTY_ADDRESS,
        payments: [
          {
            payee: EMPTY_ADDRESS,
            amount: 100000000,
          },
        ],
        nonce: 1,
      });
    case "stake_v1":
      return new StakeValidatorV1({
        address: EMPTY_ADDRESS,
        owner: EMPTY_ADDRESS,
        stake: 1000000000000,
      });
    case "unstake_v1":
      return new UnstakeValidatorV1({
        address: EMPTY_ADDRESS,
        owner: EMPTY_ADDRESS,
      });
    case "transfer_stake_v1":
      return new TransferValidatorStakeV1({
        oldAddress: EMPTY_ADDRESS,
        newAddress: EMPTY_ADDRESS,
        oldOwner: EMPTY_ADDRESS,
        newOwner: EMPTY_ADDRESS,
        stakeAmount: 1000000000000,
        paymentAmount: 0,
      });
    case "token_burn_v1":
      return new TokenBurnV1({
        payer: EMPTY_ADDRESS,
        payee: EMPTY_ADDRESS,
        amount: 0,
        nonce: 1,
        memo: "MTIzNDU2Nzg5MA==",
      });
    default:
      throw "Unsupported type for fees";
  }
};

/**
 * Fetch transaction config chain variables.
 * @param currency currency of transaction.
 * @returns config chain vars
 */
const fetchTransactionConfigChainVars = async (currency: CryptoCurrency) => {
  const rootUrl = endpointByCurrencyId(currency.id);
  const { data: vars } = await fetch(`${rootUrl}/vars`, {
    keys: TXN_VARS.join(","),
  });
  return {
    txnFeeMultiplier: vars.txn_fee_multiplier,
    stakingFeeTxnAssertLocationV1: vars.staking_fee_txn_assert_location_v1,
    stakingFeeTxnAddGatewayV1: vars.staking_fee_txn_add_gateway_v1,
    dcPayloadSize: vars.dc_payload_size,
  };
};

/**
 * Convert data credits to helium tokens.
 * @param dc to convert to HNT
 * @param currency currency of transaction.
 * @returns converted dc to hnt
 */
const dcToHnt = async (
  dc: BigNumber,
  currency: CryptoCurrency
): Promise<BigNumber> => {
  const rootUrl = endpointByCurrencyId(currency.id);
  const dcInUSD = dc.dividedBy(100000);
  const { data: oracle } = await fetch(`${rootUrl}/oracle/prices/current`);
  const oraclePrice = new BigNumber(oracle.price).dividedBy(100000000);
  return dcInUSD.dividedBy(oraclePrice).multipliedBy(100000000);
};

/**
 * Get fees for transaction.
 * @param type type of helium payment. payment_v1 | payment_v2 |
 * @param currency currency of transaction.
 * @returns transactions fees
 */
const getFees = async (
  type = "payment_v2",
  currency: CryptoCurrency
): Promise<{ dc: BigNumber; estHnt: BigNumber }> => {
  Transaction.config(await fetchTransactionConfigChainVars(currency));
  const txn = makeFeeTxn(type);
  const dc = new BigNumber(txn.fee ?? 0);
  const estHnt = await dcToHnt(dc, currency);

  return { dc, estHnt };
};

export default getFees;
