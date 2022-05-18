#!/bin/bash

set -e
cd $(dirname $0)
cd ../src

gen() {
  for d in commands/*.ts; do
    path=${d%.*}
    name=${path#*/}
    echo 'import '$name' from "./'$path'";'
  done
  echo ''
  echo 'export default {'
  for d in commands/*.ts; do
    path=${d%.*}
    name=${path#*/}
    echo '  '$name','
  done
  echo '};'
}

gen > commands-index.ts