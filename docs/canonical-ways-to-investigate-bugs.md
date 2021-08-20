# Canonical ways to investigate bugs

This document will give some hints on efficient ways to investigate a user problem with Live Common CLI.

## Prerequisite

The particularity of Ledger is that we have many users that have various computers or account conditions and it is often not easy to reproduce some specific bugs in the same conditions. Most of the time, we can investigate things by knowing the Account's xpub (public key) which allows us to add the accounts and see what happens. Obviously, in that condition we will not be able to test the Send (we only have the public keys, we will never ask the private keys or seed to our users) but with logs we should have enough information to investigate.

### It's a bug on Ledger Live Desktop?

If the bug is related to UI issues or is specific to the desktop platform, users can either contact our Customer support (preferred way) or [create an issue on GitHub](https://github.com/LedgerHQ/ledger-live-desktop).

If it's not, we generally will suspect the bugs can be reproduced in Live Common and using our CLI.

In that case, we will ask users to **Export Logs** in the app (either via a button or via Ctrl+E).

### It's a bug on Ledger Live Mobile?

If the bug is related to UI issues, users can either contact our Customer support (preferred way) or [create an issue on GitHub](https://github.com/LedgerHQ/ledger-live-mobile).

We assume that most of the bugs on the mobile app, unless they are mobile platform-specific or UI issues, are going to be common with what can be experienced on Desktop as we use the same stack shared with our Live Common library. We will therefore usually invite users to go back to desktop, try to reproduce the issue with the same set of accounts and issue or not we ask users to Export Logs from desktop (on our side we can try to export them back to mobile to see if we reproduce the issue).

## Investigate Ledger Live Desktop logs

A logfile from Ledger Live Desktop is essentially a list of JSON objects separated by newlines.

From our [tools](../tools) project, we have a /logsviewer page that allows visualizing a log file:

https://ledger-live-tools.now.sh/logsviewer

This page allows us to quickly browse and search through the logs.
Logs are ordered from the most recent to the oldest.

One of the important log that appears at the end is the "exportLogsMeta", which has some important user contextual information (Typically we want to check which envs has been used)

<img width="1367" alt="Capture d’écran 2020-03-03 à 15 08 34" src="https://user-images.githubusercontent.com/211411/75783543-07a9c980-5d61-11ea-99d2-6c41e6076180.png">

Now depending on the problem being investigated you might want to look at the Ledger Live Desktop commands data

<img width="894" alt="Capture d’écran 2020-03-03 à 15 08 41" src="https://user-images.githubusercontent.com/211411/75783550-0b3d5080-5d61-11ea-861b-f7ffdcaf66b2.png">

or going more low level and look at the device binary exchanges

<img width="1294" alt="Capture d’écran 2020-03-03 à 15 09 18" src="https://user-images.githubusercontent.com/211411/75783551-0bd5e700-5d61-11ea-9c8f-2cb21234e03a.png">

In any case, our logs will also contain some analytics events (like the part of the app being navigated on) so we can have a big picture of what the user has been doing.

**On every investigation, we will usually want to reproduce on our side and it's often more practical to do it in the terminal with `ledger-live` CLI. Let's look at classical investigation examples.**

### A problem during account synchronisation

When a Synchronisation bug occurs, which usually is spotted by seeing a failure in the Sync icon or global notification, we can easily spot the problem in the logs.

Usually, just seeing the logs will be enough, but sometimes we need to go deeper and try to reproduce on our side. We had a lot of Tezos bugs that were specific to some accounts, for instance, Tezos KT accounts with more than 100 transactions. It was easier to spot the problem by putting ourselves in the shoes of our users.

**What you essentially will need is the Account xpub.** It can either be asked to the user or spotted in the logs:

<img width="976" alt="Capture d’écran 2020-03-03 à 16 01 07" src="https://user-images.githubusercontent.com/211411/75788726-ed73e980-5d68-11ea-9314-08f3468ab14b.png">

> **It's important to know you will also need the [DerivationMode](derivation.md)**, in this specific case, it's a legacy account which is the default, but in any other case you will see the derivation mode after the xpub, for instance, "segwit" or "native_segwit". You will have to add command parameter `-s segwit` (depending on the derivation mode)

Now that we have the xpub, we can try to sync the account:

```
ledger-live sync -c zen --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT
```

This by default should produce something like

```
Horizen legacy xpub6DBX...aeSTVwUT: ZEN 0.4005 (1 operations) (znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6 on 44'/121'/0'/0/1) (#0 xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT)
  + ZEN 0.4005       IN         9b327034b5dfe24527dfbe690588eee02b008f9d64a55522f0edeb70db122f98     2018-11-24T15:00:29.000Z
```

which is often enough to investigate the problem. We might want to have more verbosity or visiblity of the data. you can for instance use `--format json`.

When you need to see more logs, you can run the command with more verbosity using `VERBOSE` environment variable.

There are a few levels: `error, warn, info, http, verbose, debug, silly`

```
VERBOSE=debug ledger-live sync -c zen --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT

debug: load core impl
debug: using array of bytes = false
debug: sync(1) started. libcore:1:zencash:xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT:
debug: getOrCreateWallet xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT_zencash_
debug: getOrCreateAccount {"data":{"xpub":"xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT","index":0}}
debug: sync(1) syncCoreAccount
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current {"data":{}}
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current {"data":{}}
debug: sync(1) DONE coreAccount.synchronize
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/addresses/zne9gvGboTqKcBEa6zbgsuf8Tv6UDM5LaBo,znZkyhWAkMUmJ1sW5k2thzqrHYYfN9q61B3,znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6,znRPUNCKg4zJUWrrXZdjnE5SMAgQJdcixHC,zncRbz8xNZfBRpcFhJg8XmvmbCn8gb2ehwn,znp11KDrxXrU1dLYLjMCgMtPCAX6KE9Bp4d,znZS87ycoYZj72Prt23PLQe2y9ZqcAkHw7k,znkcuy8st2aABFaDsZZcGqE5isp1V8t37iM,znYDz81XKfT63Cyb1yautrEmEycXXuEUg22,znnk4ifk7gqcoh8qBsaDMktX1BhAD3aWmFq,zngALywszUxgbtmP8EnqWwyJYQGg6iqUAgf,zna1VCaQjJ6teN1aEySdSPWX2xWGSaoyfVX,znRV5XLA9jcwBqLvojSxjFEttTE8wC6LN5t,znjr8qqziUS5EVHYfnRXT9xPKyCvV3JthWF,znWqeWJoHziHeXpruqkMaDmg8w2AeZLUtYh,znRPqcNaZsuB7rBrKxPdnMVLVfN9fDyMx3Z,znfLELvXEzJExFTiYjVdg48XMz4EajS4Zuq,znVGRbA5UnL16D8hegYRNFQDhLKWRpTpURA,znaSCV4mNvQjs3xyvUU2nWewnWByp7fLUQ7,znkzUcrL32j7JxyowrsAoWCGot69YN2vpSF,znm93Cx4AFsA6wXET8K6d2mhCHsspTZAewd,znoeMwmxmXwnsEmd9stNWYBovvwZUkZ7ggg,zncdV8syMqeRgH1egjYV1nSU2kByZHrUu7H,znRyGibkg6nvU3p24Xc4MeTMaNSGkfDKHAw,znVZ9v5JPHRrxnS5tZhx3YvVaKtsJYvNsBB,znSzAgCAxARKn1pzgtRk6xJYBGXZrPguqe9,znhQko6PXcMKUeRNP8zGzsqupTA8usAm6qg,zniM8XCpq9MFuSAtB8GVGrzcfESZZwjeMR1,znXkjfWoYy5fNBRUa3SYeCebSGRw6UVVxNR,znbYHEfrmUiUe5GcWibf2VNCBRboByUxD6i,zna3nnbEVFrCnnPpxRuLfJ6yVok4XjJuE3t,znnjzdEYUtfkbtwcSXFPvhLoJ9SeBsxpn2H,znh6Bq9tVzinhVwPcVC1f6JjtYmszJqLewp,znZHcnGBMzSo6cTtVmLYM9w97Tg1bPrFRiS,znWJ7ktfN3oRPUx7zrLkHndUHJD9n8wwRVf,znZ1x9GhDKrmkJgBziUJqXr1Ljc5GMiWc4z,znSg28EodTpcty5pETBcwTe4ZCmxxbS1Xqm,znV5c5eQipunPX1HP5SBKgqP6yjQBGCZcAH,zniBADCsFqioXHMQzoABpY6FaDQfptgTdHw,znXXdgwop7W9vaGoUo6rhVxruNnWXpM8HfS/transactions?noToken=true&blockHash=00000000078f0683efb7eabf1f214f50cb6f0d4f73bd4155af056fa820c27095 {"data":{}}
http: 200 GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current (148ms)
http: 200 GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current (170ms)
http: 200 GET https://explorers.api.live.ledger.com/blockchain/v2/zen/addresses/zne9gvGboTqKcBEa6zbgsuf8Tv6UDM5LaBo,znZkyhWAkMUmJ1sW5k2thzqrHYYfN9q61B3,znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6,znRPUNCKg4zJUWrrXZdjnE5SMAgQJdcixHC,zncRbz8xNZfBRpcFhJg8XmvmbCn8gb2ehwn,znp11KDrxXrU1dLYLjMCgMtPCAX6KE9Bp4d,znZS87ycoYZj72Prt23PLQe2y9ZqcAkHw7k,znkcuy8st2aABFaDsZZcGqE5isp1V8t37iM,znYDz81XKfT63Cyb1yautrEmEycXXuEUg22,znnk4ifk7gqcoh8qBsaDMktX1BhAD3aWmFq,zngALywszUxgbtmP8EnqWwyJYQGg6iqUAgf,zna1VCaQjJ6teN1aEySdSPWX2xWGSaoyfVX,znRV5XLA9jcwBqLvojSxjFEttTE8wC6LN5t,znjr8qqziUS5EVHYfnRXT9xPKyCvV3JthWF,znWqeWJoHziHeXpruqkMaDmg8w2AeZLUtYh,znRPqcNaZsuB7rBrKxPdnMVLVfN9fDyMx3Z,znfLELvXEzJExFTiYjVdg48XMz4EajS4Zuq,znVGRbA5UnL16D8hegYRNFQDhLKWRpTpURA,znaSCV4mNvQjs3xyvUU2nWewnWByp7fLUQ7,znkzUcrL32j7JxyowrsAoWCGot69YN2vpSF,znm93Cx4AFsA6wXET8K6d2mhCHsspTZAewd,znoeMwmxmXwnsEmd9stNWYBovvwZUkZ7ggg,zncdV8syMqeRgH1egjYV1nSU2kByZHrUu7H,znRyGibkg6nvU3p24Xc4MeTMaNSGkfDKHAw,znVZ9v5JPHRrxnS5tZhx3YvVaKtsJYvNsBB,znSzAgCAxARKn1pzgtRk6xJYBGXZrPguqe9,znhQko6PXcMKUeRNP8zGzsqupTA8usAm6qg,zniM8XCpq9MFuSAtB8GVGrzcfESZZwjeMR1,znXkjfWoYy5fNBRUa3SYeCebSGRw6UVVxNR,znbYHEfrmUiUe5GcWibf2VNCBRboByUxD6i,zna3nnbEVFrCnnPpxRuLfJ6yVok4XjJuE3t,znnjzdEYUtfkbtwcSXFPvhLoJ9SeBsxpn2H,znh6Bq9tVzinhVwPcVC1f6JjtYmszJqLewp,znZHcnGBMzSo6cTtVmLYM9w97Tg1bPrFRiS,znWJ7ktfN3oRPUx7zrLkHndUHJD9n8wwRVf,znZ1x9GhDKrmkJgBziUJqXr1Ljc5GMiWc4z,znSg28EodTpcty5pETBcwTe4ZCmxxbS1Xqm,znV5c5eQipunPX1HP5SBKgqP6yjQBGCZcAH,zniBADCsFqioXHMQzoABpY6FaDQfptgTdHw,znXXdgwop7W9vaGoUo6rhVxruNnWXpM8HfS/transactions?noToken=true&blockHash=00000000078f0683efb7eabf1f214f50cb6f0d4f73bd4155af056fa820c27095 (304ms)
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/addresses/znoirKSEbEYapbvxAhLmAmmTPQfNMXsaW5P,znhPoqUPFVj7FY3L5BzN8y5hH4U35rEBVDK,znV2w3TiWfB3b9Rbr27gWcP5aANWZnmBeWE,znWA26geaRnVqfwH6rccCjRuRMDHr5YxcMB,zncLoXWHhoh5kEhhFf8iQD8fnAQXo9KZwUW,znjDxRKWFy323B81mwYXYHzEfduA98NLeJj,znhZuDbfByz56yMxyM3TbaaK12UqLuNNdE9,znhgmPYVfKWe78fDPh2afp2UqDEAtunQqsv,zneUKoCHYBqiUnaenFkk22SaxsV92eTekQR,znTFbAeHF1siVYUZZR6g3yGLNKcMAzrmEVX,znbGNDuC2xoe6Tx3rPUG6aSSPcfReTkQ27k,znnr5eLJxmrCsCpRRh17f8ZgGv8Vj12ax1n,znaV9REozE68k4NyCiHKi2JHx7S5oZhbJcs,zndyrU2j96x7HDawMqrM3Zwd96eEEiA2pYA,znXgJthcQzGMUMQ8vJJfytebJNZ4kkzotDo,znd28TiFpEZaX5d574XD3syC4L51jdiMjiC,znSYmY8a5uv11TABQ9C5guNyKsX3PYdQXqv,znahUamPtMSjYtBvZSqiJgGwuEF9yu77vja,znm8M9UT2yp5YPZj8KkEqYix2UmVLtWN9Ce,zngVSMR3QBE7aqdrp7UGZfF9wY2U5ayEwCm,znZTipXeTu3AzFhcHNBMT23Aqpi6SoMKpQP,znmQarTaaruBUuqYbUmDG3mrkYagpFyr4FT,znfKsaeM7BVqNPt3nZkHUoWSVjvti4ahEcd,znW5879twE2C683CqVT4BLP7yy2Do6fwwB1,znkMRFizpRh9QufoAHdMJhd5Hn9T2b3YuNh,znT7pUQGahPiyECMtLMiF4o5vArQHWqUxvH,znmTbBCL4LPKBJDw7iquAdrLPm7mFQzGVEr,znXWJfettqZ1LuvC9fvFB6ZVLsL9TuqaUYv,zniuCd3RWyCTzebTVPmVkN88xdx6drHegbJ,zngbZoqkk8Do5Fucs8PFCpRRyZq3MpJsmqn,znnb37cxTm9TWaEaxTJq74ZZcMubwR7fkGW,znbWuk4qRkSqCS5uhhSdeio8cXJEKWHDUyW,zni5e7dQTnPaGNvxJZCLp8yHp7kz9GZEDf3,znWaqsZ6oo2TyhvNmjaAJBRiRpN4Se5i2nA,znmN5kdKC17xpwRRza2dJHgkfGxZt37uP8V,zngS8uVeSdyysZiKmaHfMr4WgHq35X6Tz5L,znXkiReYVaGHQhBLX7sXyUqLKoehk91xmTL,znRJnRC3Mz1hmA5ur5hqGMEioh7wezxc8JC,znVaZLydPkphAfFK3DfuWhQd4cnc1rPd7z7,znoea112BaUK3gzgm3EWPGZGLZzzYSDwpj9/transactions?noToken=true {"data":{}}
http: 200 GET https://explorers.api.live.ledger.com/blockchain/v2/zen/addresses/znoirKSEbEYapbvxAhLmAmmTPQfNMXsaW5P,znhPoqUPFVj7FY3L5BzN8y5hH4U35rEBVDK,znV2w3TiWfB3b9Rbr27gWcP5aANWZnmBeWE,znWA26geaRnVqfwH6rccCjRuRMDHr5YxcMB,zncLoXWHhoh5kEhhFf8iQD8fnAQXo9KZwUW,znjDxRKWFy323B81mwYXYHzEfduA98NLeJj,znhZuDbfByz56yMxyM3TbaaK12UqLuNNdE9,znhgmPYVfKWe78fDPh2afp2UqDEAtunQqsv,zneUKoCHYBqiUnaenFkk22SaxsV92eTekQR,znTFbAeHF1siVYUZZR6g3yGLNKcMAzrmEVX,znbGNDuC2xoe6Tx3rPUG6aSSPcfReTkQ27k,znnr5eLJxmrCsCpRRh17f8ZgGv8Vj12ax1n,znaV9REozE68k4NyCiHKi2JHx7S5oZhbJcs,zndyrU2j96x7HDawMqrM3Zwd96eEEiA2pYA,znXgJthcQzGMUMQ8vJJfytebJNZ4kkzotDo,znd28TiFpEZaX5d574XD3syC4L51jdiMjiC,znSYmY8a5uv11TABQ9C5guNyKsX3PYdQXqv,znahUamPtMSjYtBvZSqiJgGwuEF9yu77vja,znm8M9UT2yp5YPZj8KkEqYix2UmVLtWN9Ce,zngVSMR3QBE7aqdrp7UGZfF9wY2U5ayEwCm,znZTipXeTu3AzFhcHNBMT23Aqpi6SoMKpQP,znmQarTaaruBUuqYbUmDG3mrkYagpFyr4FT,znfKsaeM7BVqNPt3nZkHUoWSVjvti4ahEcd,znW5879twE2C683CqVT4BLP7yy2Do6fwwB1,znkMRFizpRh9QufoAHdMJhd5Hn9T2b3YuNh,znT7pUQGahPiyECMtLMiF4o5vArQHWqUxvH,znmTbBCL4LPKBJDw7iquAdrLPm7mFQzGVEr,znXWJfettqZ1LuvC9fvFB6ZVLsL9TuqaUYv,zniuCd3RWyCTzebTVPmVkN88xdx6drHegbJ,zngbZoqkk8Do5Fucs8PFCpRRyZq3MpJsmqn,znnb37cxTm9TWaEaxTJq74ZZcMubwR7fkGW,znbWuk4qRkSqCS5uhhSdeio8cXJEKWHDUyW,zni5e7dQTnPaGNvxJZCLp8yHp7kz9GZEDf3,znWaqsZ6oo2TyhvNmjaAJBRiRpN4Se5i2nA,znmN5kdKC17xpwRRza2dJHgkfGxZt37uP8V,zngS8uVeSdyysZiKmaHfMr4WgHq35X6Tz5L,znXkiReYVaGHQhBLX7sXyUqLKoehk91xmTL,znRJnRC3Mz1hmA5ur5hqGMEioh7wezxc8JC,znVaZLydPkphAfFK3DfuWhQd4cnc1rPd7z7,znoea112BaUK3gzgm3EWPGZGLZzzYSDwpj9/transactions?noToken=true (635ms)
debug: sync(1) DONE eventBus.subscribe
debug: sync(1) start buildAccount
debug: sync(1) DONE partial query ops
debug: sync(1) DONE balance
debug: sync(1) DONE coreAccount addresses
debug: sync(1) DONE operations
info: calc for range=year with 365 datapoint
info: calc for range=month with 30 datapoint
info: calc for range=week with 7 datapoint
info: DONE. calc for range=year. 365 datapoint. period=1 range: [2019-07-01T21:59:59.999Z, 2020-06-30T21:59:59.999Z]
info: DONE. calc for range=month. 30 datapoint. period=1 range: [2020-05-31T21:59:59.999Z, 2020-06-30T21:59:59.999Z]
info: DONE. calc for range=week. 7 datapoint. period=1 range: [2020-06-23T21:59:59.999Z, 2020-06-30T21:59:59.999Z]
debug: sync(1) DONE balanceHistory
info: bitcoinResources
info: bitcoinResources DONE
Horizen legacy xpub6DBX...aeSTVwUT: ZEN 0.20052 (4ops) (zncRbz8xNZfBRpcFhJg8XmvmbCn8gb2ehwn on 44'/121'/0'/0/2) #0 xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT
1 UTXOs
0.20052      znRPUNCKg4zJUWrrXZdjnE5SMAgQJdcixHC rbf cd5ebe0d564f30850c690062d800c7764fdacfd21090edbe1f6540d6705c5485 @1 (17959)
OPERATIONS (4)
  - ZEN 0.20000374   OUT        cd5ebe0d564f30850c690062d800c7764fdacfd21090edbe1f6540d6705c5485 2020-05-29T20:23
  + ZEN 0.001        IN         ad110fe4724997ad56060d8a78e6bf2bc721a851b50dd318d067690481d21576 2020-05-29T18:47
  - ZEN 0.00100226   OUT        ad110fe4724997ad56060d8a78e6bf2bc721a851b50dd318d067690481d21576 2020-05-29T18:47
  + ZEN 0.4005244    IN         9b327034b5dfe24527dfbe690588eee02b008f9d64a55522f0edeb70db122f98 2018-11-24T15:00
debug: flush
debug: flush end
```

We can see all the networking and live-common logs.

To access an even deeper level, **especially how we are using the underlying Libcore**, you can enable `VERBOSE=silly`:

```
VERBOSE=silly ledger-live sync -c zen --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT
```

> **When --xpub is provided, the CLI will no longer need and use a Ledger device but will use the xpub instead.**

It's very verbose but you will see things like

```
...
silly: DynamicObject.newInstance {"data":[]}
silly: DynamicObject.newInstance {"data":{"value":{}}}
silly: DynamicObject#putString {"data":["KEYCHAIN_DERIVATION_SCHEME","44'/121'/<account>'/<node>/<address>"]}
silly: DynamicObject#putString {"data":{"value":{}}}
silly: DynamicObject#putBoolean {"data":["DEACTIVATE_SYNC_TOKEN",true]}
silly: DynamicObject#putBoolean {"data":{"value":{}}}
silly: DynamicObject#putString {"data":["BLOCKCHAIN_EXPLORER_API_ENDPOINT","https://explorers.api.live.ledger.com"]}
silly: DynamicObject#putString {"data":{"value":{}}}
silly: DynamicObject#putString {"data":["BLOCKCHAIN_EXPLORER_VERSION","v2"]}
silly: DynamicObject#putString {"data":{"value":{}}}
debug: getOrCreateWallet xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT_zencash_
silly: WalletPool#getWallet {"data":["xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT_zencash_"]}
silly: WalletPool#getWallet {"data":{"value":{}}}
silly: WalletPool#updateWalletConfig {"data":["xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT_zencash_",{}]}
silly: WalletPool#updateWalletConfig {"data":{"value":32}}
silly: WalletPool#getWallet {"data":["xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT_zencash_"]}
silly: WalletPool#getWallet {"data":{"value":{}}}
debug: getOrCreateAccount {"data":{"xpub":"xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT","index":0}}
silly: Wallet#getAccount {"data":[0]}
silly: Wallet#getAccount {"data":{"value":{}}}
debug: sync(1) syncCoreAccount
silly: Account#synchronize {"data":[]}
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current {"data":{}}
http: GET https://explorers.api.live.ledger.com/blockchain/v2/zen/blocks/current {"data":{}}
silly: Account#synchronize {"data":{"value":{}}}
debug: sync(1) DONE coreAccount.synchronize
silly: EventBus#subscribe {"data":[{},{}]}
silly: EventBus#subscribe {"data":{}}
...
```

### A problem during "Add Account"

The _Add Account_ flow involves the [`currencyBridge.scanAccounts`](CurrencyBridge.md) logic which itself is mostly about performing synchronisation. The main problem is that you might not know the XPUB at this point in time and it might break before. What we can do easily however is to reuse the [APDUs](apdu.md) that appears in the log and replay them against the CLI.

On top of the /logsviewer page, there is a handy button "Export APDUs" that we can use to retrieve ALL the apdus. Now, you need to locate the part that concerns the add accounts.

For instance, in this example we are investigating a ZEN scan accounts and here is the binary exchange with the device of that part: (from my testing accounts)

```
=> e040000009028000002c80000079
<= 410486f3033309829d1f1458622c6d08430f7130d4d1b2ddef378dfe4c1dd025dbbbeb51298dee5e7ad0c31a1f555fe8a2941bb0018185697276861622d0a3b1bcad237a6e6b346975357a65554a39616873554b677735635470446f374b32656554417a3473271f6a912e786b63d98809c92ba5c58beac445c698dcadb8c8e91652ce64745f9000
=> e016000000
<= 208920960407486f72697a656e035a454e9000
=> e040000009028000002c80000079
<= 410486f3033309829d1f1458622c6d08430f7130d4d1b2ddef378dfe4c1dd025dbbbeb51298dee5e7ad0c31a1f555fe8a2941bb0018185697276861622d0a3b1bcad237a6e6b346975357a65554a39616873554b677735635470446f374b32656554417a3473271f6a912e786b63d98809c92ba5c58beac445c698dcadb8c8e91652ce64745f9000
=> e04000000d038000002c8000007980000000
<= 41046a05e02c73991c84f42444cfa4b3bc1046838fe609a220b1498d766e23264d57ea4c4acaae65398c13adad5d045324e03abdeec9b3fef1d88d4abb832a44af9a237a6e53467933565a58506a48366b5944736b78544e65677a67365675634258317738466e39f205deb0a0a9763b86fecc61046a453be8a6763c8bdbceb8b3d8abff46459000
=> e04000000d038000002c8000007980000001
<= 4104392c448b6a725c7c8c32993d0483e38927830dfec299b74963d264b10e9db900215b1bf058a992604c86124f5d40c178b805da0f8af0889814cb7ffb011b4308237a6e62476d615656456d676d317a416e7a74724172617370506177574a73506a527a4af6c3ce6238696dc78ee8d57b161b25d79b89ace20515966789ac09f79c713cbd9000
```

We can save that to a `apdus.txt` file.

Now, we are going to our Terminal and we are going to replay that exact series of device exchanges. As everything is deterministic here, it should just works™.

We do this:

```
ledger-live proxy -f apdus.txt
```

which starts a server that will be able to respond like a device. It should log something like

```
5 mocked APDUs will be replayed from /Users/grenaudeau/Desktop/logs.txt
DEVICE_PROXY_URL=ws://localhost:8435
DEVICE_PROXY_URL=ws://192.168.0.25:8435

Nano S proxy started on 192.168.0.25
```

Now, we go to a new Terminal and we do the actual scan accounts via the `ledger-live sync -c ZEN` command. But we also need to make sure to use the environment `DEVICE_PROXY_URL` to use the proxy instead of a real device. (btw make sure to have removed `dbdata` folder that is used by ledger-live CLI)

```
DEVICE_PROXY_URL=ws://localhost:8435 ledger-live sync -c zen
```

which correctly results in

```
Horizen 1: ZEN 0.4005 (1 operations) (znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6 on 44'/121'/0'/0/1) (#0 xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT)
  + ZEN 0.4005       IN         9b327034b5dfe24527dfbe690588eee02b008f9d64a55522f0edeb70db122f98     2018-11-24T15:00:29.000Z
Horizen 2: ZEN 0 (0 operations) (znSgEG11ZtZw9W215Eueyv16y9LyEbJfENQ on 44'/121'/1'/0/0) (#1 xpub6DBXGC1faXnWWRUbxC9LABf9SJEoizsW22bRjEKBciUxYJ6QbVpggHELUHrhFEDdU1A6JftGFHuV4z5qAWtBduEbcV9TmxmGuQfGnsJ1yW6)
```

#### Appendice 1: give someone a series of APDUs for testing

The same technique can be used to give internal team (like libcore team) a series of APDUs to replay. This is quite easy and symmetrical to what we just did:

**(1) we start a server that record & proxy with a real device.** and save all result to a file:

```
ledger-live proxy -f logs.txt --record
```

**(2) you do the sync you want to record**. In our ZEN example, the exact same command would produce the same user's APDUs. `DEVICE_PROXY_URL=ws://localhost:8435 ledger-live sync -c zen`

> whenever you use DEVICE_PROXY_URL, it's bypassing the transport logic to use a proxy instead of a real device.

#### Appendice 2: `ledger-live generateTestScanAccounts`

An easy way to see the APDUs is also to use:

```
ledger-live generateTestScanAccounts -c ZEN
```

It will generate an actual test dataset that could be later added in live-common!

```js
// @flow
import type { CurrenciesData } from "../../../types";
import type { Transaction } from "../types";

const dataset: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "zencash seed 1",
      apdus: `
      => e040000009028000002c80000079
      <= 410486f3033309829d1f1458622c6d08430f7130d4d1b2ddef378dfe4c1dd025dbbbeb51298dee5e7ad0c31a1f555fe8a2941bb0018185697276861622d0a3b1bcad237a6e6b346975357a65554a39616873554b677735635470446f374b32656554417a3473271f6a912e786b63d98809c92ba5c58beac445c698dcadb8c8e91652ce64745f9000
      => e016000000
      <= 208920960407486f72697a656e035a454e9000
      => e040000009028000002c80000079
      <= 410486f3033309829d1f1458622c6d08430f7130d4d1b2ddef378dfe4c1dd025dbbbeb51298dee5e7ad0c31a1f555fe8a2941bb0018185697276861622d0a3b1bcad237a6e6b346975357a65554a39616873554b677735635470446f374b32656554417a3473271f6a912e786b63d98809c92ba5c58beac445c698dcadb8c8e91652ce64745f9000
      => e04000000d038000002c8000007980000000
      <= 41046a05e02c73991c84f42444cfa4b3bc1046838fe609a220b1498d766e23264d57ea4c4acaae65398c13adad5d045324e03abdeec9b3fef1d88d4abb832a44af9a237a6e53467933565a58506a48366b5944736b78544e65677a67365675634258317738466e39f205deb0a0a9763b86fecc61046a453be8a6763c8bdbceb8b3d8abff46459000
      => e04000000d038000002c8000007980000001
      <= 4104392c448b6a725c7c8c32993d0483e38927830dfec299b74963d264b10e9db900215b1bf058a992604c86124f5d40c178b805da0f8af0889814cb7ffb011b4308237a6e62476d615656456d676d317a416e7a74724172617370506177574a73506a527a4af6c3ce6238696dc78ee8d57b161b25d79b89ace20515966789ac09f79c713cbd9000
      `,
    },
  ],
};

export default dataset;
```

### A problem during Send flow, _before the device step_

Problems can appear at the beginning of the Send flow, typically when inputting the transaction data in the send form.

We have in live-common a "TransactionStatus" concept which virtually checks everything is good to broadcast the transaction. The error is likely to be contained in that.

An easy way to try that is to use `ledger-live getTransactionStatus`. The parameters it takes correspond to the Send form fields. Each family can add more field parameter (see the `families/*/cli-transaction.ts` definition or `ledger-live help`)

It also takes the same parameter of a sync, so an --xpub can be used (if not provided, we use a connected Ledger device):

```
ledger-live getTransactionStatus -c ZEN --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT --recipient znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6 --amount 100
```

In that case, I don't have enough ZEN to spend, so like the recipient field will show an error, it will also show me in the CLI:

```
{
  status: '{"errors":{"amount":"{\\"name\\":\\"NotEnoughBalance\\",\\"message\\":\\"NotEnoughBalance\\",\\"stack\\":\\"Error\\\\n    at new CustomError (/Users/grenaudeau/dev/ledger-live-common/cli/node_modules/@ledgerhq/errors/lib/helpers.js:27:18)\\\\n    at remapLibcoreErrors (/Users/grenaudeau/dev/ledger-live-common/cli/node_modules/@ledgerhq/live-common/lib/libcore/platforms/nodejs.js:543:16)\\\\n    at remapLibcoreErrors (/Users/grenaudeau/dev/ledger-live-common/cli/node_modules/@ledgerhq/live-common/lib/libcore/errors.js:18:10)\\\\n    at /Users/grenaudeau/dev/ledger-live-common/cli/node_modules/@ledgerhq/live-common/lib/libcore/getFeesForTransaction.js:46:42\\"}"},"warnings":{},"estimatedFees":"0","amount":"10000000000","totalSpent":"10000000000"}',
  transaction: '{"amount":"10000000000","recipient":"znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6","useAllAmount":false,"family":"bitcoin","feePerByte":"1","networkInfo":{"family":"bitcoin","feeItems":{"items":[{"key":"0","speed":"high","feePerByte":"10"},{"key":"1","speed":"standard","feePerByte":"10"},{"key":"2","speed":"low","feePerByte":"10"}],"defaultFeePerByte":"10"}}}'
}
```

But if all is good, I will have some data:

```
{
  status: '{"errors":{},"warnings":{},"estimatedFees":"226","amount":"10000000","totalSpent":"10000226"}',
  transaction: '{"amount":"10000000","recipient":"znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6","useAllAmount":false,"family":"bitcoin","feePerByte":"1","networkInfo":{"family":"bitcoin","feeItems":{"items":[{"key":"0","speed":"high","feePerByte":"10"},{"key":"1","speed":"standard","feePerByte":"10"},{"key":"2","speed":"low","feePerByte":"10"}],"defaultFeePerByte":"10"}}}'
}
```

Just using `getTransactionStatus` will show you if a problem occurs related to fetching fees or any other problem related to building a transaction. Now if the problem occurs at the device time, this will not be enough...

### A problem during send flow, _during the device step_

Complex user's problem can appear during the Send flow. It often occurs that the problem is specific to the user's Account and that we don't reproduce on our side.

In such case, the same technique can also be used by replaying APDUs. **Make sure to use `--disable-broadcast` to not broadcast the transaction.**

The technique involve both the sync and the replay logic. We need to know beforehand what the xpub because the transaction logic starts by having a synchronized account.

Essentially we can do this:

```
 DEVICE_PROXY_URL=ws://localhost:8435 ledger-live send --disable-broadcast -c ZEN --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT --recipient znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6 --amount 0.1
```

By using the exact same parameter as the user we could be able to reproduce, even though in practice we will likely fall into problems because transactions tends to not be identically reproductible / deterministic.

This might be a dead end and we might want to study the logs more deeply and/or try to reproduce user's conditions with our accounts or with regtest / testnets.

#### Appendice 3: `ledger-live generateTestTransaction`

The same parameter of the `ledger-live send` can be passed to `generateTestTransaction`. It generates a fully Jest test that can be used to test a transaction signature. **Beware of the transaction you are doing as you have to assume someone could broadcast it!**

```
DEVICE_PROXY_URL=ws://localhost:8435 ledger-live generateTestTransaction -c ZEN --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT --recipient znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6 --amount 0.1
```

will produce this full dataset for tests:

```js
{
  name: "Horizen legacy xpub6DBX...aeSTVwUT",
  raw: {"id":"libcore:1:zencash:xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT:","seedIdentifier":"xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT","name":"Horizen legacy xpub6DBX...aeSTVwUT","starred":true,"derivationMode":"","index":0,"freshAddress":"znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6","freshAddressPath":"44'/121'/0'/0/1","freshAddresses":[],"blockHeight":683893,"operationsCount":0,"operations":[],"pendingOperations":[],"currencyId":"zencash","unitMagnitude":8,"lastSyncDate":"2020-03-03T15:30:15.705Z","balance":"40052440","spendableBalance":"40052440","xpub":"xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT"},
  transactions: [

{
  name: "NO_NAME",
  transaction: fromTransactionRaw({"amount":"10000000","recipient":"znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6","useAllAmount":false,"family":"bitcoin","feePerByte":"1","networkInfo":{"family":"bitcoin","feeItems":{"items":[{"key":"0","speed":"high","feePerByte":"10"},{"key":"1","speed":"standard","feePerByte":"10"},{"key":"2","speed":"low","feePerByte":"10"}],"defaultFeePerByte":"10"}}}),
  expectedStatus: (account, transaction) => (
    // you can use account and transaction for smart logic. drop the =>fn otherwise
    {
  errors: {},
  warnings: {},
  estimatedFees: BigNumber("226"),
  amount: BigNumber("10000000"),
  totalSpent: BigNumber("10000226")
}
  ),
  testSignedOperation: (expect, signedOperation) => {
    expect(toSignedOperationRaw(signedOperation)).toMatchObject({"operation":{"id":"libcore:1:zencash:xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT:--OUT","hash":"","type":"OUT","blockHash":null,"blockHeight":null,"senders":["zne9gvGboTqKcBEa6zbgsuf8Tv6UDM5LaBo"],"recipients":["znaE1JH6YjjWiG23bqdCkBiC4KwZ9vo7hB6","znZkyhWAkMUmJ1sW5k2thzqrHYYfN9q61B3"],"accountId":"libcore:1:zencash:xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT:","extra":{},"date":"2020-03-03T15:31:02.482Z","value":"10000226","fee":"226"},"signature":"0100000001982f12...01f02b400000000","expirationDate":null})
  },
  apdus: `
  => e042000009000000000100000003
  <= 9000
  ...
  ...
  `
}
  ]
  }
```

### Test an XPUB on Ledger Live Desktop

You might also want to directly test user's accounts on Ledger Live Desktop by adding an XPUB. This is possible as well. **However, please note this is not a feature for Ledger Live, it's purely a developer feature and we have no guarantee to preserve it as-is.**

An easy way is to simply append the account in the app.json of Ledger Live Desktop: make sure that you don't use a password on Ledger Live, go to Settings>Help to "View user data" folder to locate the app.json file. Close Ledger Live. and append the account by xpub from terminal:

```sh
ledger-live liveData --add --appjson <appjson> -c <coin> -s <scheme> --xpub <xpub>
```

For instance:

```sh
ledger-live liveData --add --appjson /Users/gre/Library/Application\ Support/Ledger\ Live/app.json  -c ZEN --xpub xpub6DBXGC1faXnWSWofjAXjfxihNmYEcJj7KcWytuc7AZK39zS8KdgbosCjnPyHRbwKxcJxnWbzLwZYaPHFE3zoQZmGDbPzwRuoSfFaeSTVwUT
```

You can now re-open Ledger Live and see the account.

### Test an XPUB on Ledger Live Mobile

We can simply just "exports via LiveQR" from desktop, which is also a possibility from the CLI:

```sh
ledger-live exportAccounts # same parameters as in a sync
```

produces animated QR Code in the terminal!
