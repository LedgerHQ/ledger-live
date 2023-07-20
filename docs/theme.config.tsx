const themeConfig = {
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Ledger Libs Documentation" />
      <meta property="og:description" content="Ledger Libs Official Documentation" />
      <link rel="icon" href="/assets/img/favicon.ico" />
    </>
  ),
  logo: (
    <div
      style={{
        display: "flex",
      }}
    >
      <svg
        style={{ fill: "currentColor" }}
        viewBox="73 -10 1 150"
        width="30"
        height="27"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Ledger logo</title>
        <path d="M0 91.6548V128H55.293V119.94H8.05631V91.6548H0ZM138.944 91.6548V119.94H91.707V127.998H147V91.6548H138.944ZM55.3733 36.3452V91.6529H91.707V84.3842H63.4296V36.3452H55.3733ZM0 0V36.3452H8.05631V8.05844H55.293V0H0ZM91.707 0V8.05844H138.944V36.3452H147V0H91.707Z" />
      </svg>
      <span style={{ marginLeft: "5px" }}>Ledger Libs</span>
    </div>
  ),
  project: {
    link: "https://github.com/ledgerhq/ledger-live",
  },
  editLink: {
    text: "Edit this page on GitHub →",
  },
  footer: {
    text: (
      <div style={{ width: "100%", display: "grid", placeItems: "center" }}>
        <svg
          style={{ fill: "currentColor", marginBottom: "20px" }}
          version="1.1"
          id="Layer_1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          width="200px"
          viewBox="0 0 2000.58 669.35"
        >
          <path
            d="M1711.35,627.2v42.14h289.22V479.29h-42.14V627.2H1711.35z M1711.35,0v42.14h247.08v147.92h42.14V0H1711.35z M1562.2,326
	v-97.92h66.11c32.23,0,43.8,10.74,43.8,40.08v17.35c0,30.16-11.16,40.49-43.8,40.49H1562.2z M1667.14,343.35
	c30.16-7.85,51.23-35.95,51.23-69.41c0-21.07-8.26-40.08-23.96-55.37c-19.83-19.01-46.28-28.51-80.57-28.51h-92.96v289.22h41.32
	V364.01h61.98c31.81,0,44.62,13.22,44.62,46.28v69h42.14V416.9c0-45.45-10.74-62.8-43.8-67.76V343.35z M1319.26,352.85h127.26
	v-38.01h-127.26v-86.77h139.65v-38.01h-181.8v289.22h188v-38.01h-145.85V352.85z M1180.84,368.14v19.83
	c0,41.73-15.29,55.37-53.71,55.37h-9.09c-38.43,0-57.02-12.4-57.02-69.83v-77.68c0-57.84,19.42-69.83,57.84-69.83h8.26
	c37.6,0,49.58,14.05,49.99,52.89h45.45c-4.13-57.02-42.14-92.96-99.16-92.96c-27.68,0-50.82,8.68-68.17,25.2
	c-26.03,24.38-40.49,65.7-40.49,123.54c0,55.78,12.4,97.1,38.01,122.71c17.35,16.94,41.32,26.03,64.87,26.03
	c24.79,0,47.52-9.92,59.08-31.4h5.78v27.27h38.01V330.13h-111.97v38.01H1180.84z M816.43,228.07h45.04
	c42.56,0,65.7,10.74,65.7,68.59v76.02c0,57.84-23.14,68.59-65.7,68.59h-45.04V228.07z M865.18,479.29
	c78.92,0,108.25-59.91,108.25-144.61c0-85.94-31.4-144.61-109.08-144.61h-89.25v289.22H865.18z M575.55,352.85h127.26v-38.01H575.55
	v-86.77H715.2v-38.01H533.4v289.22h188v-38.01H575.55V352.85z M331.78,190.06h-42.14v289.22H479.7v-38.01H331.78V190.06z M0,479.29
	v190.06h289.22V627.2H42.14V479.29H0z M0,0v190.06h42.14V42.14h247.08V0H0z"
          />
        </svg>
        <p style={{ textAlign: "center" }}>Copyright © 2023 Ledger SAS. All rights reserved.</p>
      </div>
    ),
    docsRepositoryBase: "https://github.com/LedgerHQ/ledger-live/tree/main/docs",
  },
};

export default themeConfig;
