import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  Account as StellarSdkAccount,
  Operation as StellarSdkOperation,
  TransactionBuilder,
  Networks,
  Asset,
} from "@stellar/stellar-sdk";

const currency = getCryptoCurrencyById("stellar");

export function buildTransactionBuilder(source: StellarSdkAccount, fee: bigint) {
  const formattedFee = fee.toString();
  return new TransactionBuilder(source, {
    fee: formattedFee,
    networkPassphrase: Networks.PUBLIC,
  });
}

export function buildChangeTrustOperation(assetCode: string, assetIssuer: string) {
  return StellarSdkOperation.changeTrust({
    asset: new Asset(assetCode, assetIssuer),
  });
}

export function buildCreateAccountOperation(destination: string, amount: bigint) {
  const formattedAmount = getFormattedAmount(amount);
  return StellarSdkOperation.createAccount({
    destination: destination,
    startingBalance: formattedAmount,
  });
}

export function buildPaymentOperation({
  destination,
  amount,
  assetCode,
  assetIssuer,
}: {
  destination: string;
  amount: bigint;
  assetCode: string | undefined;
  assetIssuer: string | undefined;
}) {
  const formattedAmount = getFormattedAmount(amount);
  // Non-native assets should always have asset code and asset issuer. If an
  // asset doesn't have both, we assume it is native asset.
  const asset = assetCode && assetIssuer ? new Asset(assetCode, assetIssuer) : Asset.native();
  return StellarSdkOperation.payment({
    destination: destination,
    amount: formattedAmount,
    asset,
  });
}

function getFormattedAmount(amount: bigint) {
  const div = 10 ** currency.units[0].magnitude;
  // BigInt division is always an integer, never a float. We need to convert first to a Number.
  return (Number(amount) / div).toString();
}
