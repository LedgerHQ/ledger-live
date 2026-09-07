/** Thrown when a `@shared/i18n` consumer renders outside of an `<I18nProvider>`. */
export class MissingI18nProviderError extends Error {
  constructor(consumer: string) {
    super(
      `${consumer} was called outside of an <I18nProvider>. Mount <I18nProvider i18n={appI18nInstance}> at the app root, or wrap the component under test with the provider from "@shared/i18n/testing".`,
    );
    this.name = "MissingI18nProviderError";
  }
}
