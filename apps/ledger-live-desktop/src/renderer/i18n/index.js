import * as translationsImports from "../../../static/i18n/**/*.json";

const { default: translationsArray, filenames } = translationsImports;

const regexp = /\.\/static\/i18n\/([a-z]{2})\/(.+).json$/;

const translations = filenames.reduce((acc, filename, index) => {
  const lang = filename.match(regexp);
  return {
    ...acc,
    [lang[1]]: {
      [lang[2]]: translationsArray[index],
    },
  };
}, {});

export default translations;
