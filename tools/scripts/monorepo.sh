#!/usr/bin/env bash

##
# Inspired by https://github.com/hraban/tomono
#
# Merges one of more repositories as subtrees into a single monorepo.
# Preserves git history, branches and tags.
##

## Bash settings

# Fail fast
set -e
# Enable debug mode
# set -x
# Enable glob extensions
shopt -s extglob
shopt -s dotglob

## Variables

# Github Organization
github_org=LedgerHQ
# Repositories considered as "apps"
apps="ledger-live-desktop ledger-live-mobile"
# Repositories considered as "libs"
libs="ledger-live-common ledgerjs ui"
# Main git branch
main_branch=main

## Constants
root_dir=`pwd` # The root dir
apps_dir=apps  # Will put the apps inside this folder
libs_dir=libs  # Will put the libs inside this folder
skip_bootstrap=$NO_BOOTSTRAP # Skip bootstrap, use this if the target folder already exists
skip_tags=$NO_TAGS # Prevents fetching and merging tags
only_main_branch=$ONLY_MAIN_BRANCH

## Checks

if [ "$#" -lt 1 ]; then
  echo -e "\033[1;31m[!] Missing target folder argument.\033[0;0m"
  echo -e "Usage: $0 [target folder]"
  exit 1
fi

if [ -d $1 ] && [ -z "$skip_bootstrap" ]; then
  echo -e "\033[1;31m[!] Target folder already exists.\033[0;0m"
  exit 2
fi

## Initial setup

mkdir -p $1
cd $1

if [ -z "$skip_bootstrap" ]; then
  echo -e "\033[1m[Boostrap] \033[0;0m"

  echo -e "  > Cleanup"
  rm -Rf .git $apps_dir $libs_dir
  echo -e "  > Initializing monorepository"
  git init -q
  # Dummy package.json
  echo {\
    \"name\": \"root\",\
    \"private\": true\
  } > package.json
  # First commit
  git add .
  git commit -q -m "monorepo: initial commit"
else
  echo -e "\033[1;33m[Boostrap] <SKIPPED> \033[0;0m"
fi

if [ -z "$skip_tags" ]; then
  # This directory will contain all final tag refs (namespaced)
  rm -Rf .git/refs/namespaced-tags
  if [ -e ".git/refs/tags" ]; then
    mv .git/refs/tags .git/refs/namespaced-tags
  else
    mkdir -p .git/refs/namespaced-tags
  fi
fi

## Repo. migration

function merge_branch {
  local remote=$1
  local remote_branch=$2
  local local_branch=$3
  local target_dir=$4

  echo -e "  > Merging branch $repo/$remote_branch into $local_branch"
  if git rev-parse -q --verify "$local_branch"; then
    # Branch already exists, just check it out (and clean up the working dir)
    git checkout -q -b "$local_branch" "$remote_branch"
    git checkout -q -- .
    git clean -f -d
  else
    # Create a fresh branch with an empty root commit"
    git checkout -q --orphan "$local_branch"
    # The ignore unmatch is necessary when this was a fresh repo
    git rm -rfq --ignore-unmatch .
    git commit -q --allow-empty -m "monorepo: init $repo:$remote_branch"
  fi
  # See: https://docs.github.com/en/get-started/using-git/about-git-subtree-merges
  (
    git merge -q --no-commit -s ours "$repo/$remote_branch" --allow-unrelated-histories &&\
    git read-tree --prefix="$target_dir/$repo/" -u "$repo/$remote_branch" &&\
    git commit -q --no-verify --allow-empty -m "monorepo: merge $repo:$remote_branch"
  ) || true
}

function migrate_repo {
  local repo=$1
  if [ $2 = 1 ]; then
    echo -e "\033[1m[Migration](App: $repo) \033[0;0m"
    local target_dir=$apps_dir
  else
    echo -e "\033[1m[Migration](Lib: $repo) \033[0;0m"
    local target_dir=$libs_dir
  fi

  remote_exists=`git remote | grep "^$repo$" || echo ''`
  if [ -z "$remote_exists" ]; then
    echo -e "  > Adding remote"
    git remote add "$repo" git@github.com:$github_org/$repo.git
  else
    echo -e "  > Remote exists"
  fi
  echo -e "  > Fetching remote"

  if [ -z "$skip_tags" ]; then
    git fetch -q "$repo"
    # Now we've got all tags in .git/refs/tags: put them away for a sec
    echo -e "  > Namespace and backup tags"
    if [[ -n "$(ls .git/refs/tags)" ]]; then
      mv .git/refs/tags ".git/refs/namespaced-tags/$repo"
    fi
  else
    git fetch -q -n "$repo"
  fi


  branches=`git branch -r --list --format="%(refname:lstrip=3)" "$repo/*"`
  for branch in $branches; do
    if [ -z "$only_main_branch" ]; then
      # Merge every branch.
      merge_branch $repo $branch $branch $target_dir
    elif [[ $branch = $main_branch || $branch = "master" ]]; then
      # Merge only master & main branches.
      merge_branch $repo $branch $main_branch $target_dir
    fi
  done

  echo -e "  > Done"
}

## Libs migration

for lib in $(echo $libs); do
  migrate_repo $lib 0
done

## Apps migration

for app in $(echo $apps); do
  migrate_repo $app 1
done

## Finalization pass

echo -e "\033[1m\
[Finalizing]\
\033[0;0m"

# Restore all namespaced and backuped tags
if [ -z "$skip_tags" ]; then
  echo -e "  > Restore tags"
  rm -rf .git/refs/tags
  mv .git/refs/namespaced-tags .git/refs/tags
fi

echo -e "  > Checkout $main_branch"
git checkout -q $main_branch
git checkout -q .

echo -e "  > Git GC pass"
# Git gc pass to optimize repo
git gc --aggressive

echo -e "\033[1;32m\
✅ All Done!\
\033[0;0m"
