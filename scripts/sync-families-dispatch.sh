#!/bin/bash

set -e
cd $(dirname $0)

targets="\
customAddressValidation.js \
hw-getAddress.js \
hw-signMessage.js \
libcore-buildOperation.js \
libcore-buildSubAccounts.js \
libcore-getFeesForTransaction.js \
libcore-postSyncPatch.js \
libcore-getAccountNetworkInfo.js \
transaction.js \
bridge/js.js \
bridge/libcore.js \
bridge/mock.js \
cli-transaction.js \
test-dataset.js \
test-specifics.js \
"

cd ../src

rm -rf generated
mkdir generated
mkdir generated/bridge

genTarget () {
  t=$1
  echo '// @flow'
  for family in $families; do
    if [ -f $family/$t ]; then
      echo -n 'import '$family' from "'
      OIFS=$IFS
      IFS="/"
      for f in $t; do
        echo -n '../'
      done
      IFS=$OIFS
      echo -n 'families/'$family/$t'";'
      echo
    fi
  done
  echo
  echo 'export default {'
  for family in $families; do
    if [ -f $family/$t ]; then
      echo '  '$family','
    fi
  done
  echo '};'
}

cd families

families=""
for f in *; do
  if [ -d $f ]; then
    families="$families $f"
  fi
done

for t in $targets; do
  out=../generated/$t
  if [[ "$out" != *.js ]]; then
    out=$out.js
  fi
  genTarget $t > $out
done

# types

genTypesFile () {
  echo '// @flow'
  for family in $families; do
    echo 'import { reflect as '$family'Reflect } from "../families/'$family'/types";'
    echo 'import type { CoreStatics as CoreStatics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreAccountSpecifics as CoreAccountSpecifics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreOperationSpecifics as CoreOperationSpecifics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreCurrencySpecifics as CoreCurrencySpecifics_'$family' } from "../families/'$family'/types";'
    echo 'import type { Transaction as '$family'Transaction } from "../families/'$family'/types";'
    echo 'import type { TransactionRaw as '$family'TransactionRaw } from "../families/'$family'/types";'
    echo 'import type { NetworkInfo as '$family'NetworkInfo } from "../families/'$family'/types";'
    echo 'import type { NetworkInfoRaw as '$family'NetworkInfoRaw } from "../families/'$family'/types";'
  done
  echo
  echo 'export type SpecificStatics = {}'
  for family in $families; do
    echo '& CoreStatics_'$family
  done
  echo 'export type CoreAccountSpecifics = {}'
  for family in $families; do
    echo '& CoreAccountSpecifics_'$family
  done
  echo 'export type CoreOperationSpecifics = {}'
  for family in $families; do
    echo '& CoreOperationSpecifics_'$family
  done
  echo 'export type CoreCurrencySpecifics = {}'
  for family in $families; do
    echo '& CoreCurrencySpecifics_'$family
  done
  echo 'export type Transaction ='
  for family in $families; do
    echo '  | '$family'Transaction'
  done
  echo 'export type TransactionRaw ='
  for family in $families; do
    echo '  | '$family'TransactionRaw'
  done
  echo 'export type NetworkInfo ='
  for family in $families; do
    echo '  | '$family'NetworkInfo'
  done
  echo 'export type NetworkInfoRaw ='
  for family in $families; do
    echo '  | '$family'NetworkInfoRaw'
  done
  echo 'export const reflectSpecifics = (declare: *) => ['
  for family in $families; do
    echo '  '$family'Reflect(declare),'
  done
  echo '];'
}

genTypesFile > ../generated/types.js
