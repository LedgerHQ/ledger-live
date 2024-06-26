# Coin-tester

- [Setup](#setup)
- [Run tests for a coin module](#runtests)

## Setup {#setup}

### Prerequisites

- Ledger Live development setup

```sh
git clone git@github.com:LedgerHQ/ledger-live.git
cd ledger-live
pnpm install
pnpm build:libs
```

- [Docker](https://docs.docker.com/engine/install)

### Build the speculos image

You only have to build speculos locally if you are on a Mac M1. Otherwise you can uncomment the image provided in the docker-compose.yml

1. Clone speculos: `git clone git@github.com:LedgerHQ/speculos.git`
2. Patch Dockerfile:

```Dockerfile
# before
FROM ghcr.io/ledgerhq/speculos-builder:latest AS builder
# after
FROM speculos-builder:latest AS builder
```

3. Build image
```sh
cd speculos
docker build -f build.Dockerfile -t speculos-builder:latest .
docker build -f Dockerfile -t speculos:latest .
```

### Environment variables

- Generate a [Github token classic](https://github.com/settings/tokens) and make sure to authorize Ledger SSO

- Go in the coin-module you want to test and create a `.env` in the folder where your test resides.
For exemple for `coin-evm` create the file should be located in: `src/__test__/coin-tester/.env`.

Copy `.env.example`.

```bash
cp .env.example .env
```

A `.env` should have at the very least the following attributes:

```conf
SEED=chronic find success crew board merit elder life achieve scout gravity soul brief pen job
GH_TOKEN=
API_PORT=4040
SPECULOS_IMAGE=speculos
```

If you want you can generate a new seed using [this tool](https://iancoleman.io/bip39/)

### Coin Module Specific setup

#### Polkadot

To coin Polkadot Coin tester we will need to build the local test node Docker image.

```sh
pnpm coin:polkadot coin-tester:build
```

## Run tests for a coin module {#runtests}

```sh
pnpm coin:<coin-module-name> coin-tester

# e.g
# pnpm coin:ethereum coin-tester
# pnpm coin:polkadot coin-tester
```
