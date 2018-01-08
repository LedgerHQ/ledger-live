#/bin/bash

rm -rf lib/ &&
babel src -d lib &&
flow-copy-source src lib
