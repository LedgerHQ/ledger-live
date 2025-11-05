dbs=(
  atlas-bitcoin
  a4-bitcoin
)

for db in "${dbs[@]}"; do
  echo "Creating database $db"
  createdb $db -w -U username
done
