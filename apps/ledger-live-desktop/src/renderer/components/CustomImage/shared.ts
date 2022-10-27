import { ImageDownloadError } from "@ledgerhq/live-common/customImage/errors";

export const targetDimensions = {
  height: 672,
  width: 400,
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
