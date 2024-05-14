# Coin-tester

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/)

### Build the speculos image

You only have to build speculos locally if you are on a Mac M1. Otherwise you can uncomment the image provided in the docker-compose.yml

1. Clone speculos repo 
3. docker build -f build.Dockerfile -t speculos-builder:latest .
4 Patch Dockerfile:
```Dockerfile
# before
FROM ghcr.io/ledgerhq/speculos-builder:latest AS builder
# after
FROM speculos-builder:latest AS builder
```

4. docker build -f Dockerfile -t speculos:latest .

### Environment variables

Go in the coin-module you want to test and create a `.env` in the folder where your test resides.
For exemple for `coin-evm` create the file should be located in: `src/__test__/coin-test/.env`.

If availble you can copy the `.env.example`.

```bash
cp .env.example .env
```

A `.env` should have at the very least the following attributes:

```conf
SEED=12 words
```

Generate a new seed using [this tool](https://iancoleman.io/bip39/)
Generate a Github token as [described here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
