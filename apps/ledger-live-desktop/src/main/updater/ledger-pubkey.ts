export default (__PRERELEASE__ && (process.env.UPDATE_CHECK_PUBKEY || __UPDATE_CHECK_PUBKEY__)) ||
  `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEN7qcsG6bogi1nkD3jnMWS813wWguYEcI
CRcijSvFskSFjHB5la4xUt+Omb2t6iUwop+JRy+EUhy0UQ9p/cPsQA==
-----END PUBLIC KEY-----
`;
