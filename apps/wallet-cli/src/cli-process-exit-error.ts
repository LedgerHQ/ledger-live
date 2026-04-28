/**
 * Sentinel error thrown instead of process.exit() to signal a desired exit code
 * without actually terminating the process. Used by output.ts and caught by:
 *   - runMain() (in-process test runner): captures the code and returns it
 *   - import.meta.main guard (subprocess entry): calls process.exit(code)
 *
 * The `isCliProcessExitError` marker enables duck-typed detection in the
 * @bunli/core patch without requiring an import from this module.
 */
export class CliProcessExitError extends Error {
  readonly isCliProcessExitError = true as const;
  constructor(readonly code: number) {
    super(`CLI exit ${code}`);
  }
}
