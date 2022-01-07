#!/usr/bin/env bash

##
# Merges one branch from a remote into the monorepository.
##

## Bash settings

# Fail fast
# set -e
# Enable debug mode
# set -x

if [ "$#" -lt 2 ]; then
  echo -e "\033[1;31m[!] Missing one or more arguments.\033[0;0m"
  echo -e "\033[1mUsage:\033[0;0m $0 [origin] [branch]"
  echo -e "\033[1mExample:\033[0;0m $0 ledger-live-desktop develop"
  exit 1
fi

origin=$1
branch=$2

git merge -s subtree "$origin/$branch"

if [ $? -ne 0 ]; then
  echo -e "\033[1;31m[!] Failed to merge automatically.\033[0;0m"
  echo -e "If conflicts were found, solve and commit and then run \033[1mgit merge --continue\033[0;0m to resume."
fi