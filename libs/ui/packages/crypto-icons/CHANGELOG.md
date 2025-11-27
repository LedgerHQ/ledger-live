# @ledgerhq/icons-ui

## 1.24.0-next.0

### Minor Changes

- [#12677](https://github.com/LedgerHQ/ledger-live/pull/12677) [`fe81926`](https://github.com/LedgerHQ/ledger-live/commit/fe81926afeb2df8e917e6bd1e4cbab13f09647fd) Thanks [@semeano](https://github.com/semeano)! - Add 0G coin

- [#12968](https://github.com/LedgerHQ/ledger-live/pull/12968) [`a3425cf`](https://github.com/LedgerHQ/ledger-live/commit/a3425cf0563667ac933765625e155f22db870ae1) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Introduce a test that forbid too big icons

- [#12734](https://github.com/LedgerHQ/ledger-live/pull/12734) [`903ea9c`](https://github.com/LedgerHQ/ledger-live/commit/903ea9cdacf704a0119de2803a4f409b775391a5) Thanks [@semeano](https://github.com/semeano)! - Add Monad testnet

- [#12963](https://github.com/LedgerHQ/ledger-live/pull/12963) [`1416051`](https://github.com/LedgerHQ/ledger-live/commit/141605179eeffc4d475150a3cfdeee431c21c7ee) Thanks [@semeano](https://github.com/semeano)! - Fix Somnia icon

- [#11549](https://github.com/LedgerHQ/ledger-live/pull/11549) [`6baa679`](https://github.com/LedgerHQ/ledger-live/commit/6baa679f53c04fff0e2a2e71ed2815d5ed78c856) Thanks [@ysitbon](https://github.com/ysitbon)! - Migrate to React-Native New-Architecture

## 1.23.0

### Minor Changes

- [#12524](https://github.com/LedgerHQ/ledger-live/pull/12524) [`42d9805`](https://github.com/LedgerHQ/ledger-live/commit/42d98050de48a1222bfca663dd4b8da7aafa3ee9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Optimized all crypto icon SVG files using SVGO, reducing total size by ~1.25 MB (939KB from optimization + 337KB from removal of oversized files). Restored `viewBox` attributes to ensure proper rendering on Ledger Live Mobile. Removed 8 oversized files (>10KB) that couldn't be reasonably optimized: D.svg (137KB), MATICX.svg (80KB), BNBX.svg (25KB), WAIFU.svg (24KB), ETHX.svg (23KB), ROCK.svg (19KB), SD.svg (18KB), INS.svg (11KB). All remaining 649 SVG files have been optimized with no visual changes, improving load times and performance across the application.

## 1.23.0-next.0

### Minor Changes

- [#12524](https://github.com/LedgerHQ/ledger-live/pull/12524) [`42d9805`](https://github.com/LedgerHQ/ledger-live/commit/42d98050de48a1222bfca663dd4b8da7aafa3ee9) Thanks [@gre-ledger](https://github.com/gre-ledger)! - Optimized all crypto icon SVG files using SVGO, reducing total size by ~1.25 MB (939KB from optimization + 337KB from removal of oversized files). Restored `viewBox` attributes to ensure proper rendering on Ledger Live Mobile. Removed 8 oversized files (>10KB) that couldn't be reasonably optimized: D.svg (137KB), MATICX.svg (80KB), BNBX.svg (25KB), WAIFU.svg (24KB), ETHX.svg (23KB), ROCK.svg (19KB), SD.svg (18KB), INS.svg (11KB). All remaining 649 SVG files have been optimized with no visual changes, improving load times and performance across the application.

## 1.22.0

### Minor Changes

- [#11370](https://github.com/LedgerHQ/ledger-live/pull/11370) [`b600bb7`](https://github.com/LedgerHQ/ledger-live/commit/b600bb70c65f5e151ad22a7d2b485363aa8eaea3) Thanks [@EduardoFromTheFuture](https://github.com/EduardoFromTheFuture)! - Add logo for RIZE token to ledger live. Token is already listed.

  Contract address (Base):
  RIZE - 0x9818B6c09f5ECc843060927E8587c427C7C93583

  Contract address (BSC):
  RIZE - 0xaedaff046601beb063b647845dfb21841f32d6a4

  Contract address (Ethereum):
  RIZE - 0x9F1E8F87c6321b84baD7DDa7DfB86D5115A47605

  Contract address (Polygon):
  RIZE - 0x9F1E8F87c6321b84baD7DDa7DfB86D5115A47605

- [#12420](https://github.com/LedgerHQ/ledger-live/pull/12420) [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d) Thanks [@semeano](https://github.com/semeano)! - Add Monad currency

- [#12520](https://github.com/LedgerHQ/ledger-live/pull/12520) [`62f3021`](https://github.com/LedgerHQ/ledger-live/commit/62f3021603bbfda619ca0c4dcd72a2f61874c5d6) Thanks [@semeano](https://github.com/semeano)! - Fix Monad icon

## 1.22.0-next.0

### Minor Changes

- [#11370](https://github.com/LedgerHQ/ledger-live/pull/11370) [`b600bb7`](https://github.com/LedgerHQ/ledger-live/commit/b600bb70c65f5e151ad22a7d2b485363aa8eaea3) Thanks [@EduardoFromTheFuture](https://github.com/EduardoFromTheFuture)! - Add logo for RIZE token to ledger live. Token is already listed.

  Contract address (Base):
  RIZE - 0x9818B6c09f5ECc843060927E8587c427C7C93583

  Contract address (BSC):
  RIZE - 0xaedaff046601beb063b647845dfb21841f32d6a4

  Contract address (Ethereum):
  RIZE - 0x9F1E8F87c6321b84baD7DDa7DfB86D5115A47605

  Contract address (Polygon):
  RIZE - 0x9F1E8F87c6321b84baD7DDa7DfB86D5115A47605

- [#12420](https://github.com/LedgerHQ/ledger-live/pull/12420) [`34b28dd`](https://github.com/LedgerHQ/ledger-live/commit/34b28dd5e819906daaa79db5fe6064674def5e7d) Thanks [@semeano](https://github.com/semeano)! - Add Monad currency

- [#12520](https://github.com/LedgerHQ/ledger-live/pull/12520) [`62f3021`](https://github.com/LedgerHQ/ledger-live/commit/62f3021603bbfda619ca0c4dcd72a2f61874c5d6) Thanks [@semeano](https://github.com/semeano)! - Fix Monad icon

## 1.21.0

### Minor Changes

- [#12126](https://github.com/LedgerHQ/ledger-live/pull/12126) [`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - use pnpm catalog for react & react-dom

- [#12014](https://github.com/LedgerHQ/ledger-live/pull/12014) [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Canton testnet + logo update

- [#11660](https://github.com/LedgerHQ/ledger-live/pull/11660) [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202) Thanks [@Antoine-bls83](https://github.com/Antoine-bls83)! - Support Westend on LL

## 1.21.0-next.0

### Minor Changes

- [#12126](https://github.com/LedgerHQ/ledger-live/pull/12126) [`4cac377`](https://github.com/LedgerHQ/ledger-live/commit/4cac377401fac788e2bbedf7aee1ee57b82f4d18) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - use pnpm catalog for react & react-dom

- [#12014](https://github.com/LedgerHQ/ledger-live/pull/12014) [`1d9860c`](https://github.com/LedgerHQ/ledger-live/commit/1d9860cd1688131d391579955b40c6710b667db8) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Canton testnet + logo update

- [#11660](https://github.com/LedgerHQ/ledger-live/pull/11660) [`cab7d97`](https://github.com/LedgerHQ/ledger-live/commit/cab7d9794e7babb8220c6d339fb08e618e3d4202) Thanks [@Antoine-bls83](https://github.com/Antoine-bls83)! - Support Westend on LL

## 1.20.0

### Minor Changes

- [#11581](https://github.com/LedgerHQ/ledger-live/pull/11581) [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed) Thanks [@Canestin](https://github.com/Canestin)! - feature (lld,llm): integrate Core DAO Mainnet

## 1.20.0-next.0

### Minor Changes

- [#11581](https://github.com/LedgerHQ/ledger-live/pull/11581) [`4d60b7e`](https://github.com/LedgerHQ/ledger-live/commit/4d60b7e0984f0f8ef75c1483e0cfaf5784fbc5ed) Thanks [@Canestin](https://github.com/Canestin)! - feature (lld,llm): integrate Core DAO Mainnet

## 1.19.0

### Minor Changes

- [#11672](https://github.com/LedgerHQ/ledger-live/pull/11672) [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8) Thanks [@semeano](https://github.com/semeano)! - Kaspa commons libs

- [#11727](https://github.com/LedgerHQ/ledger-live/pull/11727) [`12909c4`](https://github.com/LedgerHQ/ledger-live/commit/12909c464d22e72d741262df106d0b3ce7f9130a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add canton devnet icon

- [#11747](https://github.com/LedgerHQ/ledger-live/pull/11747) [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update IOTA ticker

## 1.19.0-next.0

### Minor Changes

- [#11672](https://github.com/LedgerHQ/ledger-live/pull/11672) [`d56bebe`](https://github.com/LedgerHQ/ledger-live/commit/d56bebe672a1ed825697b371662dbff19dcc63d8) Thanks [@semeano](https://github.com/semeano)! - Kaspa commons libs

- [#11727](https://github.com/LedgerHQ/ledger-live/pull/11727) [`12909c4`](https://github.com/LedgerHQ/ledger-live/commit/12909c464d22e72d741262df106d0b3ce7f9130a) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add canton devnet icon

- [#11747](https://github.com/LedgerHQ/ledger-live/pull/11747) [`0108eaf`](https://github.com/LedgerHQ/ledger-live/commit/0108eafb64e36ce68f44e03cc3f66ccdb5ee5a92) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Update IOTA ticker

## 1.18.0

### Minor Changes

- [#11463](https://github.com/LedgerHQ/ledger-live/pull/11463) [`7e4ac62`](https://github.com/LedgerHQ/ledger-live/commit/7e4ac62bd383f96e5649b225e0ff824fe7663695) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Update World of Dypians (WoD) icon

## 1.18.0-next.0

### Minor Changes

- [#11463](https://github.com/LedgerHQ/ledger-live/pull/11463) [`7e4ac62`](https://github.com/LedgerHQ/ledger-live/commit/7e4ac62bd383f96e5649b225e0ff824fe7663695) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Update World of Dypians (WoD) icon

## 1.17.0

### Minor Changes

- [#11225](https://github.com/LedgerHQ/ledger-live/pull/11225) [`96654b0`](https://github.com/LedgerHQ/ledger-live/commit/96654b01611519901cb1957213c154f8bcda599c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - add canton icon

## 1.17.0-next.0

### Minor Changes

- [#11225](https://github.com/LedgerHQ/ledger-live/pull/11225) [`96654b0`](https://github.com/LedgerHQ/ledger-live/commit/96654b01611519901cb1957213c154f8bcda599c) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - add canton icon

## 1.16.0

### Minor Changes

- [#10774](https://github.com/LedgerHQ/ledger-live/pull/10774) [`061f626`](https://github.com/LedgerHQ/ledger-live/commit/061f6268cbbf0f56d90cd2d117b714fe8559d271) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix: remove icon for SKY

## 1.16.0-next.0

### Minor Changes

- [#10774](https://github.com/LedgerHQ/ledger-live/pull/10774) [`061f626`](https://github.com/LedgerHQ/ledger-live/commit/061f6268cbbf0f56d90cd2d117b714fe8559d271) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - fix: remove icon for SKY

## 1.15.0

### Minor Changes

- [#10229](https://github.com/LedgerHQ/ledger-live/pull/10229) [`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade React Native from 0.75 to 0.77

## 1.15.0-next.0

### Minor Changes

- [#10229](https://github.com/LedgerHQ/ledger-live/pull/10229) [`bf4b791`](https://github.com/LedgerHQ/ledger-live/commit/bf4b7919e5e66605ea3e77562626db5d26898246) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Upgrade React Native from 0.75 to 0.77

## 1.14.0

### Minor Changes

- [#10115](https://github.com/LedgerHQ/ledger-live/pull/10115) [`0c268fb`](https://github.com/LedgerHQ/ledger-live/commit/0c268fbc9d08f98b2b383fde36d77e92b5953675) Thanks [@0xukhezo](https://github.com/0xukhezo)! - Add logo for SIDESHIFT XAI token to ledger. Support for tokens was added to ledger live desktop already
  Contract address (ethereum):
  SIDESHIFT XAI - 0x35e78b3982E87ecfD5b3f3265B601c046cDBe232

## 1.14.0-next.0

### Minor Changes

- [#10115](https://github.com/LedgerHQ/ledger-live/pull/10115) [`0c268fb`](https://github.com/LedgerHQ/ledger-live/commit/0c268fbc9d08f98b2b383fde36d77e92b5953675) Thanks [@0xukhezo](https://github.com/0xukhezo)! - Add logo for SIDESHIFT XAI token to ledger. Support for tokens was added to ledger live desktop already
  Contract address (ethereum):
  SIDESHIFT XAI - 0x35e78b3982E87ecfD5b3f3265B601c046cDBe232

## 1.13.0

### Minor Changes

- [#9888](https://github.com/LedgerHQ/ledger-live/pull/9888) [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431) Thanks [@palra](https://github.com/palra)! - add babylon currency

## 1.13.0-next.0

### Minor Changes

- [#9888](https://github.com/LedgerHQ/ledger-live/pull/9888) [`de92b67`](https://github.com/LedgerHQ/ledger-live/commit/de92b67ab9c8a553a817a245cecbfe292249d431) Thanks [@palra](https://github.com/palra)! - add babylon currency

## 1.12.0

### Minor Changes

- [#9230](https://github.com/LedgerHQ/ledger-live/pull/9230) [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81) Thanks [@lawRathod](https://github.com/lawRathod)! - Add support for mina blockchain

## 1.12.0-next.0

### Minor Changes

- [#9230](https://github.com/LedgerHQ/ledger-live/pull/9230) [`bf3dec3`](https://github.com/LedgerHQ/ledger-live/commit/bf3dec3eb166f80e066f466e0e03291c9a141a81) Thanks [@lawRathod](https://github.com/lawRathod)! - Add support for mina blockchain

## 1.11.0

### Minor Changes

- [#9611](https://github.com/LedgerHQ/ledger-live/pull/9611) [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add SUI coin send and receive abilities

## 1.11.0-next.0

### Minor Changes

- [#9611](https://github.com/LedgerHQ/ledger-live/pull/9611) [`a656e47`](https://github.com/LedgerHQ/ledger-live/commit/a656e47c1dc3ac8b578debf9cf80eab370c7086f) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add SUI coin send and receive abilities

## 1.10.0

### Minor Changes

- [#9245](https://github.com/LedgerHQ/ledger-live/pull/9245) [`3ed81b0`](https://github.com/LedgerHQ/ledger-live/commit/3ed81b059f9d8755b58a966bd6647dd34a840378) Thanks [@DatDraggy](https://github.com/DatDraggy)! - Add logo for FLT token to ledger live. Token is already listed.
  Contract address (ethereum):
  FLT - 0x236501327e701692a281934230af0b6be8df3353

## 1.10.0-next.0

### Minor Changes

- [#9245](https://github.com/LedgerHQ/ledger-live/pull/9245) [`3ed81b0`](https://github.com/LedgerHQ/ledger-live/commit/3ed81b059f9d8755b58a966bd6647dd34a840378) Thanks [@DatDraggy](https://github.com/DatDraggy)! - Add logo for FLT token to ledger live. Token is already listed.
  Contract address (ethereum):
  FLT - 0x236501327e701692a281934230af0b6be8df3353

## 1.9.0

### Minor Changes

- [#9292](https://github.com/LedgerHQ/ledger-live/pull/9292) [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature (lld,llm): integrate Sonic

## 1.9.0-next.0

### Minor Changes

- [#9292](https://github.com/LedgerHQ/ledger-live/pull/9292) [`0a59343`](https://github.com/LedgerHQ/ledger-live/commit/0a59343b591dab4e886c21cb47f7339231997331) Thanks [@francois-guerin-ledger](https://github.com/francois-guerin-ledger)! - feature (lld,llm): integrate Sonic

## 1.8.0

### Minor Changes

- [#8396](https://github.com/LedgerHQ/ledger-live/pull/8396) [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support for Aptos blockchain

- [#8731](https://github.com/LedgerHQ/ledger-live/pull/8731) [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb) Thanks [@Canestin](https://github.com/Canestin)! - Zenrock integration

## 1.8.0-next.0

### Minor Changes

- [#8396](https://github.com/LedgerHQ/ledger-live/pull/8396) [`d98a964`](https://github.com/LedgerHQ/ledger-live/commit/d98a96476c3d44eab1575f6c7c58ec03b5daf890) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Support for Aptos blockchain

- [#8731](https://github.com/LedgerHQ/ledger-live/pull/8731) [`c2d24cd`](https://github.com/LedgerHQ/ledger-live/commit/c2d24cd0299ea04e39306279b6f833696bc4f4fb) Thanks [@Canestin](https://github.com/Canestin)! - Zenrock integration

## 1.7.0

### Minor Changes

- [#8704](https://github.com/LedgerHQ/ledger-live/pull/8704) [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1) Thanks [@Canestin](https://github.com/Canestin)! - add xion currency

## 1.7.0-next.0

### Minor Changes

- [#8704](https://github.com/LedgerHQ/ledger-live/pull/8704) [`1fa754d`](https://github.com/LedgerHQ/ledger-live/commit/1fa754deed730bb3dd8d05cb4e83e8c8d1b33ad1) Thanks [@Canestin](https://github.com/Canestin)! - add xion currency

## 1.6.0

### Minor Changes

- [#8205](https://github.com/LedgerHQ/ledger-live/pull/8205) [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0) Thanks [@Canestin](https://github.com/Canestin)! - add mantra currency

- [#8182](https://github.com/LedgerHQ/ledger-live/pull/8182) [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for ZKsync currency

## 1.6.0-next.0

### Minor Changes

- [#8205](https://github.com/LedgerHQ/ledger-live/pull/8205) [`2013b0f`](https://github.com/LedgerHQ/ledger-live/commit/2013b0f23d7f5bccff58dfd93fd45333194b8ae0) Thanks [@Canestin](https://github.com/Canestin)! - add mantra currency

- [#8182](https://github.com/LedgerHQ/ledger-live/pull/8182) [`63e5392`](https://github.com/LedgerHQ/ledger-live/commit/63e5392a108f1bec7cfc9c413db1550e7b5c9a25) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for ZKsync currency

## 1.5.1

### Patch Changes

- [#7566](https://github.com/LedgerHQ/ledger-live/pull/7566) [`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be) Thanks [@albertov19](https://github.com/albertov19)! - Updated logos for Moonbeam/Moonriver

## 1.5.1-next.0

### Patch Changes

- [#7566](https://github.com/LedgerHQ/ledger-live/pull/7566) [`f275f48`](https://github.com/LedgerHQ/ledger-live/commit/f275f48a17eeba2bdd3119e478975c8d4c7183be) Thanks [@albertov19](https://github.com/albertov19)! - Updated logos for Moonbeam/Moonriver

## 1.5.0

### Minor Changes

- [#7740](https://github.com/LedgerHQ/ledger-live/pull/7740) [`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add etherlink evm currency

## 1.5.0-next.0

### Minor Changes

- [#7740](https://github.com/LedgerHQ/ledger-live/pull/7740) [`c83af75`](https://github.com/LedgerHQ/ledger-live/commit/c83af756fb388043c9f5a3862cae1231ec99a02c) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add etherlink evm currency

## 1.4.1

### Patch Changes

- [#7770](https://github.com/LedgerHQ/ledger-live/pull/7770) [`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303) Thanks [@Wozacosta](https://github.com/Wozacosta)! - adds angle tokens icon

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7533](https://github.com/LedgerHQ/ledger-live/pull/7533) [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4) Thanks [@Wozacosta](https://github.com/Wozacosta)! - adds stader tokens icons

## 1.4.1-next.0

### Patch Changes

- [#7770](https://github.com/LedgerHQ/ledger-live/pull/7770) [`3de65c8`](https://github.com/LedgerHQ/ledger-live/commit/3de65c89b64bc8ba6f5d29c819753d25146c5303) Thanks [@Wozacosta](https://github.com/Wozacosta)! - adds angle tokens icon

- [#7710](https://github.com/LedgerHQ/ledger-live/pull/7710) [`cc291f5`](https://github.com/LedgerHQ/ledger-live/commit/cc291f5466d80a2b7e9394338ab588ecd3db4623) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Migrating the Matic currency to POL (see https://polygon.technology/blog/save-the-date-matic-pol-migration-coming-september-4th-everything-you-need-to-know)

- [#7672](https://github.com/LedgerHQ/ledger-live/pull/7672) [`fb9466a`](https://github.com/LedgerHQ/ledger-live/commit/fb9466a4d7827fd4759c726ad3ae0b43dddcacd3) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - Add support for jettons

- [#7533](https://github.com/LedgerHQ/ledger-live/pull/7533) [`c21eddc`](https://github.com/LedgerHQ/ledger-live/commit/c21eddcf11683d018875e0a247ac53a4f4c4a2f4) Thanks [@Wozacosta](https://github.com/Wozacosta)! - adds stader tokens icons

## 1.4.0

### Minor Changes

- [#7394](https://github.com/LedgerHQ/ledger-live/pull/7394) [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - Support for TON blockchain

### Patch Changes

- [#7442](https://github.com/LedgerHQ/ledger-live/pull/7442) [`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the size of polkadot icon that was bigger than others

## 1.4.0-next.0

### Minor Changes

- [#7394](https://github.com/LedgerHQ/ledger-live/pull/7394) [`4bd91de`](https://github.com/LedgerHQ/ledger-live/commit/4bd91de13442d12acce3ee83d5f2fd5f087570cf) Thanks [@emmanuelm41](https://github.com/emmanuelm41)! - Support for TON blockchain

### Patch Changes

- [#7442](https://github.com/LedgerHQ/ledger-live/pull/7442) [`3415d7d`](https://github.com/LedgerHQ/ledger-live/commit/3415d7df077e0c1d44d0d0ce9a26efd8e5ac4811) Thanks [@LucasWerey](https://github.com/LucasWerey)! - Change the size of polkadot icon that was bigger than others

## 1.3.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

## 1.3.0-next.0

### Minor Changes

- [#7138](https://github.com/LedgerHQ/ledger-live/pull/7138) [`ef2d53d`](https://github.com/LedgerHQ/ledger-live/commit/ef2d53d514f1f4e6f18fc79fa3423bd9b0208a04) Thanks [@lvndry](https://github.com/lvndry)! - removes via, vtc and ppc support

## 1.2.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

## 1.2.0-next.0

### Minor Changes

- [#6596](https://github.com/LedgerHQ/ledger-live/pull/6596) [`77fa530`](https://github.com/LedgerHQ/ledger-live/commit/77fa530c8626df94fa7f9c0a8b3a99f2efa7cb11) Thanks [@KVNLS](https://github.com/KVNLS)! - Upgrade React Native to version 0.73.6

- [#6977](https://github.com/LedgerHQ/ledger-live/pull/6977) [`2f2b754`](https://github.com/LedgerHQ/ledger-live/commit/2f2b754b1350360ca0d9f761ca6e4a8cbaff141b) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Scroll & Scroll Sepolia

## 1.1.0

### Minor Changes

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

### Patch Changes

- [#5987](https://github.com/LedgerHQ/ledger-live/pull/5987) [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c) Thanks [@gre](https://github.com/gre)! - fix icon of PYUSD

- [#6159](https://github.com/LedgerHQ/ledger-live/pull/6159) [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Linea icons

- [#6068](https://github.com/LedgerHQ/ledger-live/pull/6068) [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558) Thanks [@mle-gall](https://github.com/mle-gall)! - Fixed source SVG causing storybook build error

## 1.1.0-next.0

### Minor Changes

- [#6195](https://github.com/LedgerHQ/ledger-live/pull/6195) [`dfac39b`](https://github.com/LedgerHQ/ledger-live/commit/dfac39b2086f0475d1bc8065032bfe27cbf424f6) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Base Sepolia & Arbitrum Sepolia

### Patch Changes

- [#5987](https://github.com/LedgerHQ/ledger-live/pull/5987) [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c) Thanks [@gre](https://github.com/gre)! - fix icon of PYUSD

- [#6159](https://github.com/LedgerHQ/ledger-live/pull/6159) [`4715e4c`](https://github.com/LedgerHQ/ledger-live/commit/4715e4c411fa2396330ebcb810aeb6bfc9892e88) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Update Linea icons

- [#6068](https://github.com/LedgerHQ/ledger-live/pull/6068) [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558) Thanks [@mle-gall](https://github.com/mle-gall)! - Fixed source SVG causing storybook build error

## 1.0.2

### Patch Changes

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`26f343b`](https://github.com/LedgerHQ/ledger-live/commit/26f343b3c08d06ce6e812947d4c63a6e5bae8a9e) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - fix icon of PYUSD

- [#6165](https://github.com/LedgerHQ/ledger-live/pull/6165) [`f882dde`](https://github.com/LedgerHQ/ledger-live/commit/f882dde22ec194c5cd3dd9413b8c103108eba820) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - Fixed source SVG causing storybook build error

## 1.0.2-next.0

### Patch Changes

- [#5987](https://github.com/LedgerHQ/ledger-live/pull/5987) [`97bafa2`](https://github.com/LedgerHQ/ledger-live/commit/97bafa2573436572fca63469b13214bfcd7eb85c) Thanks [@gre](https://github.com/gre)! - fix icon of PYUSD

- [#6068](https://github.com/LedgerHQ/ledger-live/pull/6068) [`8096795`](https://github.com/LedgerHQ/ledger-live/commit/80967954758a5e1d2960ac593fc6314391737558) Thanks [@mle-gall](https://github.com/mle-gall)! - Fixed source SVG causing storybook build error

## 1.0.1

### Patch Changes

- [#5820](https://github.com/LedgerHQ/ledger-live/pull/5820) [`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6) Thanks [@lvndry](https://github.com/lvndry)! - Rename Coreum ticker to COREUM

## 1.0.1-next.0

### Patch Changes

- [#5820](https://github.com/LedgerHQ/ledger-live/pull/5820) [`fc2cf04`](https://github.com/LedgerHQ/ledger-live/commit/fc2cf04c8d3cd55503ea19aeb21fd12ee55046f6) Thanks [@lvndry](https://github.com/lvndry)! - Rename Coreum ticker to COREUM

## 1.0.0

### Major Changes

- [#5394](https://github.com/LedgerHQ/ledger-live/pull/5394) [`0e2287b`](https://github.com/LedgerHQ/ledger-live/commit/0e2287b1ce4200004ed2c06f3e74cd3b03100784) Thanks [@KaliszukTomasz](https://github.com/KaliszukTomasz)! - Add logo for GSWIFT token to ledger. Support for tokens was added to ledger live desktop already
  Contract address (arbitrum):
  GSWIFT - 0x580e933d90091b9ce380740e3a4a39c67eb85b4c

## 1.0.0-next.0

### Major Changes

- [#5394](https://github.com/LedgerHQ/ledger-live/pull/5394) [`0e2287b`](https://github.com/LedgerHQ/ledger-live/commit/0e2287b1ce4200004ed2c06f3e74cd3b03100784) Thanks [@KaliszukTomasz](https://github.com/KaliszukTomasz)! - Add logo for GSWIFT token to ledger. Support for tokens was added to ledger live desktop already
  Contract address (arbitrum):
  GSWIFT - 0x580e933d90091b9ce380740e3a4a39c67eb85b4c

## 0.7.0

### Minor Changes

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

### Patch Changes

- [#5640](https://github.com/LedgerHQ/ledger-live/pull/5640) [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6) Thanks [@chabroA](https://github.com/chabroA)! - Update telos logo

## 0.7.0-next.0

### Minor Changes

- [#4947](https://github.com/LedgerHQ/ledger-live/pull/4947) [`2edfa53`](https://github.com/LedgerHQ/ledger-live/commit/2edfa533bccafbfd8a61aea0f5422c0db79825ea) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - vechain integration

### Patch Changes

- [#5640](https://github.com/LedgerHQ/ledger-live/pull/5640) [`335ce83`](https://github.com/LedgerHQ/ledger-live/commit/335ce8366c8c997cdd77f191262a9dedee9888f6) Thanks [@chabroA](https://github.com/chabroA)! - Update telos logo

## 0.6.1

### Patch Changes

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

## 0.6.1-next.0

### Patch Changes

- [#5292](https://github.com/LedgerHQ/ledger-live/pull/5292) [`08dde174fd`](https://github.com/LedgerHQ/ledger-live/commit/08dde174fdeaadbce85dcd914383839f788f21dd) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add support for Lukso

## 0.6.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

### Patch Changes

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#5222](https://github.com/LedgerHQ/ledger-live/pull/5222) [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update injective icons

## 0.6.0-next.0

### Minor Changes

- [#5167](https://github.com/LedgerHQ/ledger-live/pull/5167) [`f5a5c315ea`](https://github.com/LedgerHQ/ledger-live/commit/f5a5c315ea2200cd5b52ef3a0b377d1327b1144e) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Integrate Dydx

### Patch Changes

- [#4827](https://github.com/LedgerHQ/ledger-live/pull/4827) [`fc121ce96d`](https://github.com/LedgerHQ/ledger-live/commit/fc121ce96dbcc4f30cfd9836644f778b85f997b7) Thanks [@valpinkman](https://github.com/valpinkman)! - Update react to react 18

- [#5222](https://github.com/LedgerHQ/ledger-live/pull/5222) [`22df6b230c`](https://github.com/LedgerHQ/ledger-live/commit/22df6b230c72d82d18375fb7ae7e8da599f41070) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - update injective icons

## 0.5.1

### Patch Changes

- [#4259](https://github.com/LedgerHQ/ledger-live/pull/4259) [`5696f24b93`](https://github.com/LedgerHQ/ledger-live/commit/5696f24b93151bc0ee063d1cb88cef1e2d052f9e) Thanks [@live-github-bot](https://github.com/apps/live-github-bot)! - publish ui libraries with fixed tests

## 0.5.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

### Patch Changes

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

## 0.5.0-next.0

### Minor Changes

- [#4021](https://github.com/LedgerHQ/ledger-live/pull/4021) [`e5f9cc46d6`](https://github.com/LedgerHQ/ledger-live/commit/e5f9cc46d69b82ad7267296b350e9d97a47f9e86) Thanks [@lambertkevin](https://github.com/lambertkevin)! - Add telos evm currency

### Patch Changes

- [#4130](https://github.com/LedgerHQ/ledger-live/pull/4130) [`cfbff52724`](https://github.com/LedgerHQ/ledger-live/commit/cfbff527241534aba69bff3d86733b50a14eb4ce) Thanks [@hzheng-ledger](https://github.com/hzheng-ledger)! - coreum integration

## 0.4.0

### Minor Changes

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

## 0.4.0-next.0

### Minor Changes

- [#3825](https://github.com/LedgerHQ/ledger-live/pull/3825) [`9692adc2a6`](https://github.com/LedgerHQ/ledger-live/commit/9692adc2a6774feb4424fc7a984810918c946b1b) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Cosmos chains : stargaze, desmos, umee, secret network

## 0.3.0

### Minor Changes

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

## 0.3.0-next.0

### Minor Changes

- [#2809](https://github.com/LedgerHQ/ledger-live/pull/2809) [`51c01541df`](https://github.com/LedgerHQ/ledger-live/commit/51c01541df8a414851ea4ef493dc9045272ef949) Thanks [@hedi-edelbloute](https://github.com/hedi-edelbloute)! - Add Quicksilver, Persistence, Onomy, Axelar to Cosmos family

## 0.2.2

### Patch Changes

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade dependencies

## 0.2.2-next.0

### Patch Changes

- [#2888](https://github.com/LedgerHQ/ledger-live/pull/2888) [`ac0fc92005`](https://github.com/LedgerHQ/ledger-live/commit/ac0fc92005a69e5bfe5f37cfed7a3c2a344f4c27) Thanks [@elbywan](https://github.com/elbywan)! - Upgrade dependencies

## 0.2.1

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 0.2.1-next.0

### Patch Changes

- [#1141](https://github.com/LedgerHQ/ledger-live/pull/1141) [`24ea9cd15f`](https://github.com/LedgerHQ/ledger-live/commit/24ea9cd15f92d5a2c74c4b936bacb89d5d4d36fd) Thanks [@valpinkman](https://github.com/valpinkman)! - Collateral changes due to solving all LLM typescript/eslint issues/warnings.

## 0.2.0

### Minor Changes

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa8994`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

## 0.2.0-next.0

### Minor Changes

- [#935](https://github.com/LedgerHQ/ledger-live/pull/935) [`432cfa899`](https://github.com/LedgerHQ/ledger-live/commit/432cfa8994e21c2e67d72bd0e6e94a64d7cc2dfb) Thanks [@LFBarreto](https://github.com/LFBarreto)! - UI - Crypto icons added as a standalone package + added helper components to integrate them and ensure color contrast

## 0.1

### Patch Changes

- Initial release
