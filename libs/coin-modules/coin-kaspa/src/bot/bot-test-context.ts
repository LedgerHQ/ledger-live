type EnhancedError = Error & {
  _bot_context?: string[];
};

// This provides a botTest("description", () => {}) helper in order to give context in bot expect tests
export function botTest(description: string, f: () => void): void {
  try {
    f();
  } catch (e) {
    if (e instanceof Error) {
      const err = e as EnhancedError;
      err._bot_context = [description].concat(err._bot_context || []);
      throw err;
    }
    throw e;
  }
}

// retrieve the text context of a given error that was thrown from inside a botTest(...)
export function getContext(error: any): string | undefined {
  if (error instanceof Error) {
    return ((error as EnhancedError)._bot_context || []).join(" > ");
  }
}
