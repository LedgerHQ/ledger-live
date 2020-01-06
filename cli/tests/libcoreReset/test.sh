#!/bin/bash
set -e

ledger-live libcoreReset

ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f summary

ledger-live libcoreReset

# TODO for now just checking it doesn't break. later we'll check it effectively clean things.