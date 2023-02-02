import { ImageDownloadError } from "@ledgerhq/live-common/customImage/errors";

export const targetDisplayDimensions = {
  width: 400,
  height: 670,
};

export const targetDataDimensions = {
  width: 400,
  height: 672,
};

export async function urlContentToDataUri(url: string): Promise<string> {
  return fetch(url)
    .then(response => {
      if (response.status !== 200) throw new ImageDownloadError();
      return response.blob();
    })
    .then(
      blob =>
        new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result !== "string")
              throw new Error(`reader.result is not a string: ${typeof reader.result}`);
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        }),
    );
}
