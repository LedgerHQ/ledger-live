"""Compare develop vs branch account dumps: per transaction hash, which live operations changed.

usage: python3 compare.py <account> [--verbose]
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
VOLATILE_EXTRA = {"pagingToken"}


def load(variant, account):
    return json.loads((HERE / "out" / variant / f"{account}.json").read_text())


def all_ops(dump):
    """(scope, op) for parent ops and every sub-account op."""
    for op in dump["operations"]:
        yield "native", op
    for sub in dump["subAccounts"]:
        for op in sub["operations"]:
            yield sub["tokenId"], op


def shape(op):
    extra = {k: v for k, v in (op.get("extra") or {}).items() if k not in VOLATILE_EXTRA}
    return {
        "type": op["type"],
        "value": op["value"],
        "fee": op["fee"],
        "signed": op["signed"],
        "senders": op["senders"],
        "recipients": op["recipients"],
        "hasFailed": op["hasFailed"],
        "extra": extra,
        "subOperations": len(op["subOperations"]),
    }


def base_hash(op):
    # staking reward ops carry a derived hash; key them by the tx's consensus timestamp instead
    return (op.get("extra") or {}).get("consensusTimestamp") or op["hash"]


def index(dump):
    by_tx = defaultdict(list)
    for scope, op in all_ops(dump):
        by_tx[base_hash(op)].append((scope, op))
    return by_tx


def duplicates(dump):
    ids = Counter(op["id"] for _, op in all_ops(dump))
    return [i for i, n in ids.items() if n > 1]


def signed_sum(ops):
    return sum(int(op["signed"]) for op in ops)


def main():
    account = sys.argv[1]
    verbose = "--verbose" in sys.argv
    dev, br = load("develop", account), load("branch", account)
    dev_tx, br_tx = index(dev), index(br)

    print(f"# {account}")
    for name, d in (("develop", dev), ("branch", br)):
        native = [op for s, op in all_ops(d) if s == "native"]
        print(
            f"{name:8} ops={len(native)} subOps={sum(len(s['operations']) for s in d['subAccounts'])} "
            f"balance={d['balance']} opsSum={signed_sum(native)} dupIds={len(duplicates(d))}"
        )
        for sub in d["subAccounts"]:
            gap = int(sub["balance"]) - signed_sum(sub["operations"])
            if gap:
                print(f"         {sub['tokenId']}: balance - opsSum = {gap}")

    changed = Counter()
    report = []
    for tx in sorted(set(dev_tx) | set(br_tx)):
        a = sorted((s, json.dumps(shape(op), sort_keys=True)) for s, op in dev_tx.get(tx, []))
        b = sorted((s, json.dumps(shape(op), sort_keys=True)) for s, op in br_tx.get(tx, []))
        if a == b:
            continue
        dev_signed = defaultdict(int)
        br_signed = defaultdict(int)
        for s, op in dev_tx.get(tx, []):
            dev_signed[s] += int(op["signed"])
        for s, op in br_tx.get(tx, []):
            br_signed[s] += int(op["signed"])
        net_changed = {
            s: (dev_signed[s], br_signed[s])
            for s in set(dev_signed) | set(br_signed)
            if dev_signed[s] != br_signed[s]
        }
        kind = "net-amount-changed" if net_changed else "presentation-only"
        changed[kind] += 1
        report.append((tx, kind, net_changed, a, b))

    print(f"\ntransactions: develop={len(dev_tx)} branch={len(br_tx)} changed={dict(changed)}")
    for tx, kind, net_changed, a, b in report:
        print(f"\n## {tx}  [{kind}]")
        for s, (d, n) in net_changed.items():
            print(f"   net {s}: develop {d} -> branch {n}")
        if verbose or kind == "net-amount-changed":
            only_a = [x for x in a if x not in b]
            only_b = [x for x in b if x not in a]
            for s, j in only_a:
                print(f"   - {s} {j}")
            for s, j in only_b:
                print(f"   + {s} {j}")


main()
