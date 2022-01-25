#!/bin/bash
set -e

ledger-live libcoreReset

ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary

ledger-live libcoreReset

# TODO for now just checking it doesn't break. later we'll check it effectively clean things.