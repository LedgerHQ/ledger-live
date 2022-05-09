#!/bin/bash

set -e

cd ../..
PATH=$(pnpm bin):$PATH
cd -

documentation readme src/** --section=API --pe ts --re ts --re d.ts