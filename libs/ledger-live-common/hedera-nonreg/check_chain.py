"""Check each variant's history against the chain: per transaction (consensus timestamp) and asset,
the signed sum of live operations must equal the account's net movement on the mirror node / hgraph.

usage: python3 check_chain.py <account> [--verbose]
"""
import json
import sys
import subprocess
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).parent
MIRROR = "https://hedera.coin.ledger.com"
HGRAPH = "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql"


def get(url, body=None):
    # curl, because python's http client loses response bodies behind the sandbox proxy
    cmd = ["curl", "-sSf", "--retry", "4", "--max-time", "60", url]
    if body:
        cmd += ["-H", "content-type: application/json", "-d", json.dumps(body)]
    return json.loads(subprocess.run(cmd, check=True, capture_output=True).stdout)


def mirror_transactions(account, since):
    cache = HERE / "out" / "chain" / f"{account}@{since}.mirror.json"
    if cache.exists():
        return json.loads(cache.read_text())
    txs, path = [], f"/api/v1/transactions?account.id={account}&limit=100&order=desc" + (f"&timestamp=gte:{since}" if since else "")
    while path:
        page = get(MIRROR + path)
        txs += page["transactions"]
        path = page["links"].get("next")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(txs))
    return txs


def erc20_rows(account, since):
    cache = HERE / "out" / "chain" / f"{account}@{since}.erc20.json"
    if cache.exists():
        return json.loads(cache.read_text())
    num = int(account.split(".")[-1])
    rows, offset = [], 0
    while True:
        query = (
            "query { erc_token_transfer(where: {consensus_timestamp: {_gte: %d}, _or: [{sender_account_id: {_eq: %d}}, {receiver_account_id: {_eq: %d}}]}, "
            "order_by: {consensus_timestamp: desc, log_index: asc}, limit: 500, offset: %d) "
            "{ amount consensus_timestamp log_index sender_account_id receiver_account_id token_evm_address transaction_hash transfer_type } }"
            % (since * 10**9, num, num, offset)
        )
        page = get(HGRAPH, {"query": query})["data"]["erc_token_transfer"]
        rows += page
        if len(page) < 500:
            break
        offset += 500
    cache.write_text(json.dumps(rows))
    return rows


def chain_movements(account, since):
    """{consensus_timestamp: {asset: net}}; asset is 'native', an HTS token id or an ERC20 evm address."""
    moves = defaultdict(lambda: defaultdict(int))
    hash_to_ts = {}
    for tx in mirror_transactions(account, since):
        ts = tx["consensus_timestamp"]
        hash_to_ts[tx["transaction_hash"]] = ts
        moves[ts]  # every listed tx exists, even with no net movement
        for t in tx.get("transfers") or []:
            if t["account"] == account:
                moves[ts]["native"] += t["amount"]
        for t in tx.get("token_transfers") or []:
            if t["account"] == account:
                moves[ts][t["token_id"]] += t["amount"]
    num = int(account.split(".")[-1])
    for row in erc20_rows(account, since):
        amount = int(row["amount"])
        delta = (amount if row["receiver_account_id"] == num else 0) - (
            amount if row["sender_account_id"] == num else 0
        )
        key = "erc20:" + row["token_evm_address"].lower()
        # hgraph timestamps are JSON numbers (precision loss) and incoming ERC20 txs are not listed
        # by the mirror account filter, so ERC20 movements are keyed by consensus second
        ts = "erc20@" + str(int(row["consensus_timestamp"]) // 10**9)
        moves[ts][key] += delta
    return moves


def live_movements(dump):
    moves = defaultdict(lambda: defaultdict(int))
    for op in dump["operations"]:
        ts = (op.get("extra") or {}).get("consensusTimestamp", "?" + op["hash"])
        moves[ts]["native"] += int(op["signed"])
    for sub in dump["subAccounts"]:
        token = sub["tokenId"]
        asset = "erc20:" + token.split("_")[-1].lower() if "/erc20/" in token else token.split("_")[-1]
        for op in sub["operations"]:
            ts = (op.get("extra") or {}).get("consensusTimestamp", "?" + op["hash"])
            if asset.startswith("erc20:"):
                ts = "erc20@" + ts.split(".")[0]
            moves[ts][asset] += int(op["signed"])
    return moves


def main():
    account = sys.argv[1]
    verbose = "--verbose" in sys.argv
    dumps = {v: HERE / "out" / v / f"{account}.json" for v in ("develop", "branch")}
    since = max(int(json.loads(p.read_text()).get("since") or 0) for p in dumps.values() if p.exists())
    since = since // 10 * 10  # the sync resumes at a 10s synthetic block boundary
    chain = chain_movements(account, since)
    # busy accounts keep transacting after the sync: ignore chain records newer than what was synced
    # (both variants sync at the same time, and one may have synced nothing)
    last_synced = max(
        max((float(op["extra"]["consensusTimestamp"]) for op in json.loads(p.read_text())["operations"]
             if (op.get("extra") or {}).get("consensusTimestamp")), default=0)
        for p in dumps.values() if p.exists()
    )
    chain = {ts: m for ts, m in chain.items() if float(ts.split("@")[-1]) <= last_synced}
    live_assets = set()
    results = {}
    for variant in ("develop", "branch"):
        path = HERE / "out" / variant / f"{account}.json"
        if not path.exists():
            continue
        dump = json.loads(path.read_text())
        live = live_movements(dump)
        tracked = {a for m in live.values() for a in m} | {"native"}
        tracked |= {
            ("erc20:" + s["tokenId"].split("_")[-1].lower()) if "/erc20/" in s["tokenId"] else s["tokenId"].split("_")[-1]
            for s in dump["subAccounts"]
        }
        live_assets |= tracked
        mismatches = {}
        for ts in set(chain) | set(live):
            for asset in tracked:
                c, l = chain.get(ts, {}).get(asset, 0), live.get(ts, {}).get(asset, 0)
                if c != l:
                    mismatches[(ts, asset)] = (c, l)
        results[variant] = mismatches

    print(f"# {account} since {since or 'genesis'}: {len(chain)} chain transactions")
    for variant, mismatches in results.items():
        print(f"{variant:8} mismatched (tx, asset): {len(mismatches)}")
    dev, br = results.get("develop", {}), results.get("branch", {})
    fixed = sorted(set(dev) - set(br))
    broken = sorted(set(br) - set(dev))
    both = sorted(set(dev) & set(br))
    print(f"fixed by branch: {len(fixed)}  broken by branch: {len(broken)}  wrong in both: {len(both)}")
    txs = {tx["consensus_timestamp"]: tx for tx in mirror_transactions(account, since)}
    erc20_seconds = {ts.split("@")[1] for ts in chain if ts.startswith("erc20@")}

    def category(ts, asset):
        c = chain.get(ts, {}).get(asset, 0)
        l = (br.get((ts, asset)) or dev.get((ts, asset)))[1]
        tx = txs.get(ts, {})
        if asset == "native" and tx.get("name") in ("CONTRACTCALL", "ETHEREUMTRANSACTION") and l == -c:
            return "native sign flipped on contract call (CONTRACT_CALL counted as outgoing)"
        if asset == "native" and ts.split(".")[0] in erc20_seconds:
            return "native leg wrong on a tx with ERC20 rows (ERC20.md Finding 2)"
        if asset.startswith("erc20:") and l == 0:
            return "ERC20 leg missing (parent not a CONTRACTCALL?)"
        if ts not in chain:
            return "live movement with no chain record"
        return f"other ({tx.get('name', '?')})"

    for title, keys in (("BROKEN BY BRANCH", broken), ("WRONG IN BOTH", both), ("FIXED BY BRANCH", fixed)):
        if not keys:
            continue
        print(f"\n## {title}")
        groups = {}
        for key in keys:
            groups.setdefault(category(*key), []).append(key)
        for name, group in sorted(groups.items(), key=lambda g: -len(g[1])):
            print(f"  [{len(group)}x] {name}")
            for ts, asset in group if verbose else group[:3]:
                c = chain.get(ts, {}).get(asset, 0)
                print(f"     {ts} {asset}: chain {c}  develop {dev.get((ts, asset), (c, c))[1]}  branch {br.get((ts, asset), (c, c))[1]}")

main()
