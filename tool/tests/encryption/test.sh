#!/bin/bash

echo "ENCRYPTION IS LIKELY TO FAIL, IGNORING ERRORS FOR NOW"
# Unsetting the -e flag set by parent
set +e

ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f json | jq '.operations[] | length' >> output/res

echo set password for first time
ledger-live libcoreSetPassword --password foobar
export LIBCORE_PASSWORD=foobar

ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f json | jq '.operations[] | length' >> output/res

echo change password
ledger-live libcoreSetPassword --password foo
export LIBCORE_PASSWORD=foo

ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f json | jq '.operations[] | length' >> output/res

echo decrypt the libcore
ledger-live libcoreSetPassword --password ""
export LIBCORE_PASSWORD=

ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f json | jq '.operations[] | length' >> output/res


echo set again password and try to not use encryption
ledger-live libcoreSetPassword --password foo

LIBCORE_PASSWORD=mistake ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj || true

echo "check encrypted data can be descripted later"

LIBCORE_PASSWORD=foo ledger-live sync -c bitcoin --xpub xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj -f json | jq '.operations[] | length' >> output/res

# restore -e flag
set -e

true