IFS=$'\n'
for c in `cat currencies.txt`; do
  echo "$c start Sync..."
  ledger-live app -o $c
  ledger-live deviceAppVersion >> output/${c}_app.json
  ledger-live sync --device --currency $c -s '' -f json > output/$c.json
  cat output/$c.json | jq 'del(.lastSyncDate,.blockHeight,.operations)' > output/${c}_fields.json
  cat output/$c.json | jq '.operations | sort_by(.id)[] | del(.date)' > output/${c}_operations.json
  rm output/$c.json
  ledger-live app -q
  echo "$c Sync SUCCESS"
done