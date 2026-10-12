"""Classify what changed in transactions between develop and branch (beyond net amounts).

usage: python3 presentation.py <account>
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
FIELDS = ["type", "value", "fee", "senders", "recipients", "hasFailed", "subOperations", "extra"]


def ops_by_tx(dump):
    by_tx = defaultdict(list)
    for op in dump["operations"]:
        by_tx[(op.get("extra") or {}).get("consensusTimestamp") or op["hash"]].append(("native", op))
    for sub in dump["subAccounts"]:
        for op in sub["operations"]:
            by_tx[(op.get("extra") or {}).get("consensusTimestamp") or op["hash"]].append(("token", op))
    return by_tx


def strip(op):
    extra = {k: v for k, v in (op.get("extra") or {}).items() if k != "pagingToken"}
    return {**{f: op[f] for f in FIELDS if f not in ("extra", "subOperations")},
            "subOperations": len(op["subOperations"]), "extra": extra}


def signature(a, b):
    if len(a) != len(b):
        return "op set: " + ",".join(sorted(f"{s}:{o['type']}" for s, o in a)) + " -> " + ",".join(
            sorted(f"{s}:{o['type']}" for s, o in b))
    a = sorted(a, key=lambda x: (x[0], x[1]["type"], int(x[1]["value"])))
    b = sorted(b, key=lambda x: (x[0], x[1]["type"], int(x[1]["value"])))
    parts = set()
    for (sa, oa), (sb, ob) in zip(a, b):
        da, db = strip(oa), strip(ob)
        for f in da:
            if da[f] != db[f]:
                parts.add(f"{sa}:{oa['type']}->{ob['type']}.{f}" if f == "type" else f"{sa}:{oa['type']}.{f}")
    return " ; ".join(sorted(parts))


account = sys.argv[1]
dev = ops_by_tx(json.loads((HERE / "out/develop" / f"{account}.json").read_text()))
br = ops_by_tx(json.loads((HERE / "out/branch" / f"{account}.json").read_text()))
kinds = Counter()
examples = {}
for tx in sorted(set(dev) | set(br)):
    a, b = dev.get(tx, []), br.get(tx, [])
    if sorted(json.dumps(strip(o), sort_keys=True) for _, o in a) == sorted(
            json.dumps(strip(o), sort_keys=True) for _, o in b):
        continue
    sig = signature(a, b)
    kinds[sig] += 1
    examples.setdefault(sig, (tx, a, b))

for sig, n in kinds.most_common():
    tx, a, b = examples[sig]
    print(f"\n[{n}x] {sig}\n   e.g. {tx}")
    for label, ops in (("develop", a), ("branch ", b)):
        for s, o in ops:
            print(f"   {label} {s}:{o['type']} value={o['value']} fee={o['fee']} senders={o['senders']} recipients={o['recipients']}")
