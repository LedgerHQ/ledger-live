"""Record mainnet edge cases as a coin-hedera test fixture.

For each (account, consensus timestamp) it stores what listOperationsV2 reads: the account-filtered
mirror records of that transaction (parent and children), and for ERC20 transactions the hgraph rows,
the parent record and the contract result.

usage: python3 capture.py <output.json>
"""
import json
import subprocess
import sys

MIRROR = "https://hedera.coin.ledger.com/api/v1"
HGRAPH = "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql"
RECORD_FIELDS = [
    "consensus_timestamp", "parent_consensus_timestamp", "transaction_id", "transaction_hash",
    "nonce", "name", "result", "charged_tx_fee", "node", "entity_id", "memo_base64",
    "transfers", "token_transfers", "staking_reward_transfers", "nft_transfers", "scheduled",
]

CASES = [
    ("multi-recipient HBAR send, several senders and recipients", "0.0.8835924", "1783694033.247135884"),
    ("HBAR to two recipients plus two tokens in one transfer", "0.0.8835924", "1760510879.300860000"),
    ("HTS swap paid by the account that pays HBAR out to it", "0.0.8835924", "1748002889.845379000"),
    ("relayed EVM tx: wBTC rows to the same recipient, USDC back in child records", "0.0.10608795", "1784131963.496425000"),
    ("ERC20 sold for HBAR in one contract call", "0.0.9337684", "1785752373.949418104"),
    ("failed atomic batch whose inner contract call debits beyond its charged fee", "0.0.10340822", "1773417398.396207000"),
    ("failed EVM tx, payer side of the split gas", "0.0.6319439", "1791816556.279897674"),
    ("failed EVM tx, signer side of the split gas", "0.0.10604709", "1791816556.279897674"),
    ("scheduled transfer to three recipients, fee charged to the schedule payer", "0.0.4948455", "1791771088.018032105"),
    ("allowance: the owner's HBAR moved by a spender who pays the fee", "0.0.2148853", "1791695812.887236105"),
    ("account receives HBAR, sends a token and pays the fee", "0.0.1404223", "1781622385.356656000"),
    ("DUPLICATE_TRANSACTION record that moves nothing", "0.0.10176974", "1791815933.333449586"),
    ("child record whose fee goes to the fee collection account", "0.0.10340822", "1791807904.440533105"),
    ("relayed EVM tx: incoming wBTC", "0.0.10171350", "1782440293.263884446"),
    ("relayed EVM tx: outgoing wBTC to two receivers", "0.0.10574239", "1781204382.016563000"),
    ("relayed EVM tx: four wBTC rows from the same sender", "0.0.10171350", "1782831165.339814000"),
    ("contract call: ERC20 out, HBAR in", "0.0.10171350", "1782389214.090216614"),
    ("lending call: WETH out and back in one tx", "0.0.1404223", "1781621604.470171000"),
    ("SaucerSwap token to HBAR swap paid by the account", "0.0.10574239", "1781555482.238083000"),
    ("staking reward inside a WETH-receive contract call", "0.0.5956928", "1787485271.951477104"),
    ("allowance pull: the receiver pays the fee", "0.0.10352175", "1791750777.613815397"),
    ("scheduled transfer whose transaction id names an account that pays nothing", "0.0.634576", "1790427893.663931743"),
    ("scheduled transfer from two senders", "0.0.10490943", "1791480462.285505105"),
    ("HBAR and four tokens received in one transfer", "0.0.10759344", "1787422488.994053876"),
    ("fractional custom fee taken from the received amount", "0.0.10067807", "1782483685.674882694"),
    ("fractional custom fee, collector side", "0.0.4929181", "1782483685.674882694"),
    ("token send paying a fractional custom fee", "0.0.10067807", "1782497116.413322000"),
    ("airdrop claimed by the recipient", "0.0.7982665", "1791728201.251718301"),
    ("claimed airdrop rejected back to the treasury", "0.0.7982665", "1791728395.985711104"),
    ("explicit send to the node that also collects the fee (pre HIP-1259)", "0.0.7840494", "1734081053.858590000"),
    ("explicit send to a node through another node (pre HIP-1259)", "0.0.1059024", "1731924506.898656329"),
    ("send to nine recipients, fee split across node and network accounts (pre HIP-1259)", "0.0.1505996", "1730131022.868843000"),
    ("send to eight recipients, fee to the fee collection account", "0.0.3745833", "1791384449.115559117"),
    ("failed transfer paid by the account (pre HIP-1259)", "0.0.7137125", "1729575171.003481000"),
    ("failed atomic batch with its failed inner contract call", "0.0.4093645", "1791227907.938079035"),
    ("staking reward on an incoming transfer someone else paid", "0.0.773269", "1790013907.476234104"),
    ("one tinybar sent only to trigger a staking reward", "0.0.692862", "1791368019.479425021"),
    ("transfer to the fee collection account rejected", "0.0.9753627", "1790780492.711197104"),
]


def curl(url, body=None):
    cmd = ["curl", "-sSf", "--retry", "4", "--max-time", "60", url]
    if body:
        cmd += ["-H", "content-type: application/json", "-d", json.dumps(body)]
    return json.loads(subprocess.run(cmd, check=True, capture_output=True).stdout)


def trim(record):
    return {k: record[k] for k in RECORD_FIELDS if k in record}


def capture(name, account, timestamp):
    target = curl(f"{MIRROR}/transactions?timestamp={timestamp}")["transactions"][0]
    group = curl(f"{MIRROR}/transactions/{target['transaction_id']}")["transactions"]
    stamps = sorted(r["consensus_timestamp"] for r in group)
    in_window = curl(
        f"{MIRROR}/transactions?account.id={account}&limit=100&order=desc"
        f"&timestamp=gte:{stamps[0]}&timestamp=lte:{stamps[-1]}"
    )["transactions"]
    group_stamps = set(stamps)
    records = [trim(r) for r in in_window if r["consensus_timestamp"] in group_stamps]
    case = {
        "name": name,
        "account": account,
        "evmAddress": curl(f"{MIRROR}/accounts/{account}")["evm_address"],
        "records": records,
    }

    parent = next(
        (r for r in group
         if r["parent_consensus_timestamp"] is None and r["name"] in ("CONTRACTCALL", "ETHEREUMTRANSACTION")),
        None,
    )
    if parent:
        result = curl(f"{MIRROR}/contracts/results/{parent['transaction_id']}")
        num = int(account.split(".")[-1])
        query = (
            'query { erc_token_transfer(where: {transaction_hash: {_eq: "%s"}, _or: '
            "[{sender_account_id: {_eq: %d}}, {receiver_account_id: {_eq: %d}}]}, order_by: {log_index: asc}) "
            "{ amount consensus_timestamp log_index payer_account_id sender_account_id sender_evm_address "
            "receiver_account_id receiver_evm_address token_evm_address token_id transaction_hash transfer_type } }"
            % (result["hash"][:66], num, num)
        )
        rows = curl(HGRAPH, {"query": query})["data"]["erc_token_transfer"]
        if rows:
            case["erc20"] = {
                "parent": trim(parent),
                "contractCallResult": {
                    k: result[k]
                    for k in ("contract_id", "timestamp", "block_hash", "block_gas_used", "gas_consumed", "gas_limit", "gas_used")
                },
                "transfers": rows,
            }
    return case


cases = []
for name, account, timestamp in CASES:
    case = capture(name, account, timestamp)
    print(f"{account} {timestamp}: {len(case['records'])} records, erc20 rows {len(case.get('erc20', {}).get('transfers', []))}  {name}")
    cases.append(case)

with open(sys.argv[1], "w") as out:
    json.dump(cases, out, indent=1)
    out.write("\n")
