// Re-export the upstream @mysten/ledgerjs-hw-app-sui Sui class from inlined source.
// The upstream package (0.7.1) ships a mega-bundle that inlines all dependencies
// (RxJS, @ledgerhq/*, etc.), causing ~900KB of duplication in the final bundle.
// By importing from source and resolving dependencies from the monorepo, we avoid
// bundling duplicate copies.
// Can be reverted to normal import once the upstream package is fixed.
// See: https://github.com/MystenLabs/ts-sdks/issues/967
export { default } from "./upstream/Sui";
export type {
  GetPublicKeyResult,
  SignTransactionResult,
  GetVersionResult,
  Resolution,
  AppConfig,
} from "./upstream/Sui";
