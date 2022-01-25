#!/bin/bash

set -e

ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary

echo set password for first time
ledger-live libcoreSetPassword --password foobar
export LIBCORE_PASSWORD=foobar

echo try a sync with the new password
ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary

echo change password
ledger-live libcoreSetPassword --password foo
export LIBCORE_PASSWORD=foo

echo try a sync with the changed password
ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary

echo decrypt the libcore
ledger-live libcoreSetPassword --password ""
export LIBCORE_PASSWORD=

echo try a sync after removing the password
ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary

echo set again password and try to not use encryption
ledger-live libcoreSetPassword --password foo

echo try a sync with a wrong password
set +e
LIBCORE_PASSWORD=mistake ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary
RES=$?
set -e
if [ $RES -eq 0 ]; then
  echo expected failure with wrong password
  exit 1
fi

echo check encrypted data can be descripted later
LIBCORE_PASSWORD=foo ledger-live sync -c cosmos --id cosmospub1addwnpepqwyytxex2dgejj93yjf0rg95v3eqzyxpg75p2hfr6s36tnpuy8vf5p6kez4 -f summary