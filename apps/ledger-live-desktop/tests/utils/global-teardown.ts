export default async function globalTeardown() {
  if (process.env.CI) {
    //Appeler l'export vers XRAY
  }
}
