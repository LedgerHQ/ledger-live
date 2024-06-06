export default async function globalTeardown() {
  if (process.env.CI && process.env.XRAY === 1) {
    //Appeler l'export vers XRAY (publish to xray)
    // XRAY-REPORTER
    //CE Fichier = CustomTestExecutionListener.java du Vault
  }
}
