/**
 * EthereumCryptographyResolverPlugin
 * 
 * Forces ethereum-cryptography@1.2.0 and ensures its dependencies (@noble/hashes, @noble/secp256k1)
 * resolve from its own pnpm directory, preventing version conflicts.
 * 
 * Problem:
 * - ethereum-cryptography v2.x removed the CURVE export that @ethereumjs/util needs
 * - We need to force v1.2.0 and ensure it uses the correct @noble packages
 * 
 * Solution:
 * - Intercept all ethereum-cryptography imports and redirect to v1.2.0
 * - Intercept @noble imports ONLY when coming from ethereum-cryptography@1.2.0
 */

const path = require('path');

class EthereumCryptographyResolverPlugin {
  constructor(options = {}) {
    this.options = {
      verbose: false,
      ...options,
    };
    
    // Paths to the specific versions we want to use
    this.ethereumCryptoPath = path.resolve(
      __dirname,
      '../../../node_modules/.pnpm/ethereum-cryptography@1.2.0/node_modules/ethereum-cryptography'
    );
    
    this.nobleHashesPath = path.resolve(
      __dirname,
      '../../../node_modules/.pnpm/ethereum-cryptography@1.2.0/node_modules/@noble/hashes'
    );
    
    this.nobleSecp256k1Path = path.resolve(
      __dirname,
      '../../../node_modules/.pnpm/ethereum-cryptography@1.2.0/node_modules/@noble/secp256k1'
    );

    this.stats = {
      ethereumCryptoRedirects: 0,
      nobleHashesRedirects: 0,
      nobleSecp256k1Redirects: 0,
    };
  }

  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(
      'EthereumCryptographyResolverPlugin',
      (nmf) => {
        nmf.hooks.beforeResolve.tap(
          'EthereumCryptographyResolverPlugin',
          (resolveData) => {
            if (!resolveData) return;

            const request = resolveData.request;
            const issuer = resolveData.contextInfo?.issuer || '';

            // 1. Redirect ethereum-cryptography to v1.2.0
            if (request === 'ethereum-cryptography' || request.startsWith('ethereum-cryptography/')) {
              const subpath = request.replace('ethereum-cryptography', '').replace(/^\//, '');
              const newRequest = subpath 
                ? path.join(this.ethereumCryptoPath, subpath)
                : this.ethereumCryptoPath;
              
              resolveData.request = newRequest;
              this.stats.ethereumCryptoRedirects++;
              
              if (this.options.verbose) {
                console.log(`[EthereumCryptographyResolver] Redirected: ${request} -> ${newRequest}`);
              }
              return;
            }

            // 2. Redirect @noble/hashes ONLY when imported from our ethereum-cryptography@1.2.0
            if (request.startsWith('@noble/hashes')) {
              // Check if the issuer is from our ethereum-cryptography@1.2.0 directory
              const isFromEthereumCrypto = issuer.includes('ethereum-cryptography@1.2.0');
              
              if (isFromEthereumCrypto) {
                const subpath = request.replace('@noble/hashes', '').replace(/^\//, '');
                const newRequest = subpath
                  ? path.join(this.nobleHashesPath, subpath)
                  : this.nobleHashesPath;
                
                resolveData.request = newRequest;
                this.stats.nobleHashesRedirects++;
                
                if (this.options.verbose) {
                  console.log(`[EthereumCryptographyResolver] Redirected @noble/hashes: ${request} -> ${newRequest}`);
                  console.log(`[EthereumCryptographyResolver]   From: ${issuer}`);
                }
              }
              return;
            }

            // 3. Redirect @noble/secp256k1 ONLY when imported from our ethereum-cryptography@1.2.0
            if (request.startsWith('@noble/secp256k1')) {
              const isFromEthereumCrypto = issuer.includes('ethereum-cryptography@1.2.0');
              
              if (isFromEthereumCrypto) {
                const subpath = request.replace('@noble/secp256k1', '').replace(/^\//, '');
                const newRequest = subpath
                  ? path.join(this.nobleSecp256k1Path, subpath)
                  : this.nobleSecp256k1Path;
                
                resolveData.request = newRequest;
                this.stats.nobleSecp256k1Redirects++;
                
                if (this.options.verbose) {
                  console.log(`[EthereumCryptographyResolver] Redirected @noble/secp256k1: ${request} -> ${newRequest}`);
                  console.log(`[EthereumCryptographyResolver]   From: ${issuer}`);
                }
              }
            }
          }
        );
      }
    );

    // Print summary after compilation
    compiler.hooks.done.tap('EthereumCryptographyResolverPlugin', () => {
      if (this.options.verbose && (
        this.stats.ethereumCryptoRedirects > 0 ||
        this.stats.nobleHashesRedirects > 0 ||
        this.stats.nobleSecp256k1Redirects > 0
      )) {
        console.log('[EthereumCryptographyResolver] Summary:');
        console.log(`  ethereum-cryptography: ${this.stats.ethereumCryptoRedirects} redirects`);
        console.log(`  @noble/hashes: ${this.stats.nobleHashesRedirects} redirects`);
        console.log(`  @noble/secp256k1: ${this.stats.nobleSecp256k1Redirects} redirects`);
      }
    });
  }
}

module.exports = EthereumCryptographyResolverPlugin;

