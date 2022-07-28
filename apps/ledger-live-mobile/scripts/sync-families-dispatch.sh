#!/bin/bash

set -e
cd $(dirname $0)

targets="\
operationDetails \
accountActions \
TransactionConfirmFields \
AccountHeader \
AccountBodyHeader \
AccountSubHeader \
SendAmountFields \
screens \
SendRowsCustom \
SendRowsFee \
AccountBalanceSummaryFooter \
SubAccountList \
Confirmation \
ConnectDevice \
NoAssociatedAccounts \
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
