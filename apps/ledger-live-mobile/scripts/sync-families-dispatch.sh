#!/bin/bash

set -e
cd $(dirname $0)

targets="\
operationDetails.js \
accountActions.js \
TransactionConfirmFields.js \
AccountHeader.js \
AccountBodyHeader.js \
AccountSubHeader.js \
SendAmountFields.js \
screens.js \
SendRowsCustom.js \
SendRowsFee.js \
AccountBalanceSummaryFooter.js \
SubAccountList.js \
Confirmation.js \
ConnectDevice.js \
NoAssociatedAccounts.js
"

cd ../src

rm -rf generated
mkdir generated

genTarget () {
  t=$1
  echo '// @flow'
  for family in $families; do
    if [[ -f "$family/$t".js || -f "$family/$t".tsx ]]; then
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
    if [[ -f "$family/$t".js || -f "$family/$t".tsx ]]; then
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
