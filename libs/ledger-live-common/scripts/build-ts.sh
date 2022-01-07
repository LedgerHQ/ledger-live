#!/bin/bash

# set -e

rm -rf lib src/data/icons/react* src/data/flags/react*
bash ./scripts/sync-families-dispatch.sh
node scripts/buildReactIcons.js
node scripts/buildReactFlags.js

export NODE_ENV=production
pnpm tsc --project src/tsconfig.json


# (
#     cd ../../flow-support
#     yarn copy
# )
