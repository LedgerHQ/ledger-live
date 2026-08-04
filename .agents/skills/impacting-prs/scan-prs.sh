#!/usr/bin/env bash
# Scan open PRs for a detection pattern on ADDED diff lines.
# Usage: scan-prs.sh -p '<extended-regex>' [-b develop] [-o outdir] [-j 8] [-l 300]
#                    [-x '<exclude-path-regex>'] [-m '<already-informed-marker>']
set -uo pipefail

BASE=develop
OUT="${TMPDIR:-/tmp}/impacting-prs"
JOBS=8
LIMIT=300
PATTERN=""
EXCLUDE='(^|/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|Podfile\.lock)$|^\.changeset/|\.snap$'
MARKER='[Oo]n behalf of @'

while getopts "p:b:o:j:l:x:m:" opt; do
  case "$opt" in
    p) PATTERN="$OPTARG" ;;
    b) BASE="$OPTARG" ;;
    o) OUT="$OPTARG" ;;
    j) JOBS="$OPTARG" ;;
    l) LIMIT="$OPTARG" ;;
    x) EXCLUDE="$OPTARG" ;;
    m) MARKER="$OPTARG" ;;
    *) exit 2 ;;
  esac
done
[ -z "$PATTERN" ] && { echo "missing -p <regex>" >&2; exit 2; }

mkdir -p "$OUT/diffs"

# Pinned so gh keeps resolving the repo once we leave the working tree.
GH_REPO="${GH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
export GH_REPO
echo "repo: $GH_REPO" >&2

# GitHub computes mergeability lazily: the first query returns UNKNOWN for most
# PRs and warms the cache, the second one returns real values.
list() {
  gh pr list --state open --limit "$LIMIT" \
    --json number,title,url,isDraft,mergeable,baseRefName,headRefName,author,updatedAt >/dev/null 2>&1
  sleep 3
  gh pr list --state open --limit "$LIMIT" \
    --json number,title,url,isDraft,mergeable,baseRefName,headRefName,author,updatedAt
}
list > "$OUT/all.json"

jq --arg base "$BASE" '[ .[] | select(.baseRefName == $base and .mergeable == "MERGEABLE")
  | {number, title, url, isDraft, author: .author.login, name: .author.name, headRefName, updatedAt} ]' \
  "$OUT/all.json" > "$OUT/prs.json"

jq -r --arg base "$BASE" '
  "eligible (base \($base), no conflict): \([.[]|select(.baseRefName==$base and .mergeable=="MERGEABLE")]|length)",
  "skipped  (conflicting with \($base)): \([.[]|select(.baseRefName==$base and .mergeable=="CONFLICTING")]|length)",
  "skipped  (other base branch): \([.[]|select(.baseRefName!=$base)]|length)",
  "skipped  (mergeability still unknown): \([.[]|select(.baseRefName==$base and .mergeable=="UNKNOWN")]|length)"
' "$OUT/all.json" >&2

# BSD xargs caps -I lines at 255 bytes, so fetch from inside the diffs dir.
jq -r '.[].number' "$OUT/prs.json" \
  | (cd "$OUT/diffs" && xargs -P "$JOBS" -I@ sh -c 'gh pr diff @ > @.diff 2>/dev/null || rm -f @.diff')

# Matching added lines, with the RIGHT-side line number to anchor a review
# comment on (`line` in the reviews API), skipping excluded paths.
printf 'pr\tpath\tline\tcontent\n' > "$OUT/hits.tsv"
for f in "$OUT"/diffs/*.diff; do
  [ -e "$f" ] || continue
  pr="$(basename "$f" .diff)"
  awk -v pr="$pr" -v pat="$PATTERN" -v excl="$EXCLUDE" '
    /^\+\+\+ / { path = $2; sub(/^b\//, "", path); skip = (path ~ excl); next }
    /^--- /    { next }
    /^@@/      { split($3, h, ","); n = substr(h[1], 2) + 0 - 1; next }
    /^\+/      { n++; line = substr($0, 2)   # without the diff marker, so ^-anchored patterns work
                 if (!skip && line ~ pat) printf "%s\t%s\t%d\t%s\n", pr, path, n, line
                 next }
    /^ /       { n++ }
  ' "$f" >> "$OUT/hits.tsv"
done

# Drop PRs somebody already informed: any comment or review body carrying the
# marker means the authors have been told, re-posting would just be noise.
: > "$OUT/already-informed.txt"
for pr in $(awk -F'\t' 'NR > 1 { print $1 }' "$OUT/hits.tsv" | sort -u); do
  # grep -c, not -q: -q exits early, SIGPIPEs the gh calls and trips pipefail.
  found=$({ gh api "repos/$GH_REPO/issues/$pr/comments" --jq '.[].body'
            gh api "repos/$GH_REPO/pulls/$pr/reviews" --jq '.[].body'
            gh api "repos/$GH_REPO/pulls/$pr/comments" --jq '.[].body'
          } 2>/dev/null | grep -cE "$MARKER")
  [ "${found:-0}" -gt 0 ] && echo "$pr" >> "$OUT/already-informed.txt"
done
if [ -s "$OUT/already-informed.txt" ]; then
  awk -F'\t' 'NR == FNR { informed[$1]; next } FNR == 1 || !($1 in informed)' \
    "$OUT/already-informed.txt" "$OUT/hits.tsv" > "$OUT/hits.filtered.tsv"
  mv "$OUT/hits.filtered.tsv" "$OUT/hits.tsv"
  echo "skipped  (already informed): $(wc -l < "$OUT/already-informed.txt" | tr -d ' ')" >&2
fi

echo >&2
echo "PRs with hits (pr / files / added lines):" >&2
awk -F'\t' 'NR > 1 {
    lines[$1]++; if (!seen[$1 SUBSEP $2]++) files[$1]++ }
  END { for (p in lines) printf "  #%s  %d file(s)  %d line(s)\n", p, files[p], lines[p] }
' "$OUT/hits.tsv" | sort -t'#' -k2 -rn >&2
echo >&2
echo "artifacts: $OUT/prs.json  $OUT/hits.tsv  $OUT/already-informed.txt  $OUT/diffs/" >&2
