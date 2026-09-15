export async function preloadCardNumbersImage(uri: string): Promise<void> {
  const image = new Image();
  image.referrerPolicy = "no-referrer";
  image.src = uri;
  await image.decode();
}
