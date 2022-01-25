#!/bin/bash

set -e

cd ../..
PATH=$(yarn bin):$PATH
cd -
documentation readme src/** --section=API --pe ts --re ts --re d.ts