#!/bin/bash

set -e
cd $(dirname $0)

targets="\
operationDetails.jsx \
accountActions.jsx \
TransactionConfirmFields.jsx \
AccountBodyHeader.js \
AccountSubHeader.jsx \
SendAmountFields.jsx \
SendRecipientFields.jsx \
SendWarning.js \
ReceiveWarning.jsx \
AccountBalanceSummaryFooter.jsx \
TokenList.jsx \
AccountHeaderManageActions.js \
StepReceiveFunds.jsx \
NoAssociatedAccounts.jsx
"

cd ../src/renderer

rm -rf generated
mkdir generated

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
  # if [[ "$out" != *.js ]]; then
  #   out=$out.js
  # fi
  genTarget $t > $out
done
