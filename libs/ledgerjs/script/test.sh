#!/bin/bash

set -e

cd ../..
PATH=$(pnpm bin):$PATH
cd -

jest
