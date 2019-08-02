#!/bin/bash

set -e
cd $(dirname $0)

targets="customAddressValidation hw-getAddress libcore-buildOperation libcore-buildTransaction libcore-hw-signTransaction libcore-signAndBroadcast libcore-buildTokenAccounts libcore-getFeesForTransaction libcore-postSyncPatch libcore-getFees"

cd ../src

rm -rf generated
mkdir generated

genTarget () {
  t=$1
  echo '// @flow'
  for family in *; do
    if [ -f $family/$t.js ]; then
      echo 'import '$family' from "../families/'$family/$t'";'
    fi
  done
  echo
  echo 'export default {'
  for family in *; do
    if [ -f $family/$t.js ]; then
      echo '  '$family','
    fi
  done
  echo '};'
}

cd families
for t in $targets; do
  genTarget $t > ../generated/$t.js
done

# types

genTypesFile () {
  echo '// @flow'
  for family in *; do
    echo 'import { reflect as '$family'Reflect } from "../families/'$family'/types";'
    echo 'import type { CoreStatics as CoreStatics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreAccountSpecifics as CoreAccountSpecifics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreOperationSpecifics as CoreOperationSpecifics_'$family' } from "../families/'$family'/types";'
    echo 'import type { CoreCurrencySpecifics as CoreCurrencySpecifics_'$family' } from "../families/'$family'/types";'
  done
  echo
  echo 'export type SpecificStatics = {}'
  for family in *; do
    echo '& CoreStatics_'$family
  done
  echo 'export type CoreAccountSpecifics = {}'
  for family in *; do
    echo '& CoreAccountSpecifics_'$family
  done
  echo 'export type CoreOperationSpecifics = {}'
  for family in *; do
    echo '& CoreOperationSpecifics_'$family
  done
  echo 'export type CoreCurrencySpecifics = {}'
  for family in *; do
    echo '& CoreCurrencySpecifics_'$family
  done
  echo 'export const reflectSpecifics = (declare: *) => {'
  for family in *; do
    echo $family'Reflect(declare);'
  done
  echo '};'
}

genTypesFile > ../generated/types.js