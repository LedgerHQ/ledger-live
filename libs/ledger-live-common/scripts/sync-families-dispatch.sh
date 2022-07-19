#!/bin/bash

set -e
cd $(dirname $0)

targets="\
customAddressValidation.ts \
hw-getAddress.ts \
hw-signMessage.ts \
transaction.ts \
bridge/js.ts \
bridge/mock.ts \
cli-transaction.ts \
specs.ts \
speculos-deviceActions.ts \
deviceTransactionConfig.ts \
mock.ts \
account.ts \
exchange.ts \
presync.ts \
platformAdapter.ts \
"

cd ../src

rm -rf generated
mkdir generated
mkdir generated/bridge

genTarget () {
  t=$1
  for family in $families; do
    if [ -f $family/$t ]; then
      echo -n 'import '$family' from "'
      OIFS=$IFS
      IFS="/"
      for f in $t; do
        echo -n '../'
      done
      IFS=$OIFS
      # echo -n 'families/'$family/$t'";'
      str='families/'$family/$t'";'
      echo "${str/.ts/}"
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
  if [[ "$out" != *.ts ]]; then
    out=$out.ts
  fi
  genTarget $t > $out
done

# types

genDeviceTransactionConfig () {
  for family in $families; do
    if [ -f $family/deviceTransactionConfig.ts ]; then
      if grep -q "export type ExtraDeviceTransactionField" "$family/deviceTransactionConfig.ts"; then
        echo 'import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_'$family' } from "../families/'$family'/deviceTransactionConfig";'
      fi
    fi
  done

  echo 'export type ExtraDeviceTransactionField ='
  for family in $families; do
    if [ -f $family/deviceTransactionConfig.ts ]; then
      if grep -q "export type ExtraDeviceTransactionField" "$family/deviceTransactionConfig.ts"; then
        echo '| ExtraDeviceTransactionField_'$family
      fi
    fi
  done
}

genTypesFile () {
  for family in $families; do
    echo 'import { Transaction as '$family'Transaction } from "../families/'$family'/types";'
    echo 'import { TransactionRaw as '$family'TransactionRaw } from "../families/'$family'/types";'
  done
  echo
  echo 'export type Transaction ='
  for family in $families; do
    echo '  | '$family'Transaction'
  done
  echo 'export type TransactionRaw ='
  for family in $families; do
    echo '  | '$family'TransactionRaw'
  done
}

genTypesFile > ../generated/types.ts

genDeviceTransactionConfig >> ../generated/deviceTransactionConfig.ts
