/**
 * Type augmentation for redux-actions to make it compatible with redux v5
 *
 * ### Context
 *
 * We upgraded from react-redux v7 to v9, which requires redux v5.
 * Redux v5 introduced stricter typing where dispatch() expects `UnknownAction`,
 * which requires an index signature: `[key: string]: unknown`.
 *
 * ### Problem
 *
 * The `redux-actions` library (v2.6.5) creates actions with type `Action<Payload>`
 * that don't include this index signature, causing TypeScript errors like:
 *
 * > Argument of type 'Action<T>' is not assignable to parameter of type 'UnknownAction'.
 * > Index signature for type 'string' is missing in type 'Action<T>'."
 *
 * ### Solution
 *
 * This declaration file uses TypeScript's module augmentation to merge an index
 * signature into the existing `Action` interface from redux-actions, making it
 * compatible with redux v5's `UnknownAction` type.
 *
 * ### Future
 *
 * This file can be removed if:
 * - redux-actions is updated to support redux v5, OR
 * - We migrate away from redux-actions to @reduxjs/toolkit's createAction
 *
 * @see https://redux-toolkit.js.org/usage/migrating-rtk-2 for migration guide
 */
import "redux-actions";

declare module "redux-actions" {
  // Payload generic is required to match the original interface,
  // but unused in the augmentation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Action<Payload> {
    [key: string]: unknown;
  }
}
