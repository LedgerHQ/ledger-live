import { ContextModule } from "./ContextModule";
import { DefaultContextModule } from "./DefaultContextModule";
import { HttpExternalPluginDataSource } from "./external-plugin/data/HttpExternalPluginDataSource";
import { ExternalPluginContextLoader } from "./external-plugin/domain/ExternalPluginContextLoader";
import { HttpForwardDomainDataSource } from "./forward-domain/data/HttpForwardDomainDataSource";
import { ForwardDomainContextLoader } from "./forward-domain/domain/ForwardDomainContextLoader";
import { HttpNftDataSource } from "./nft/data/HttpNftDataSource";
import { NftContextLoader } from "./nft/domain/NftContextLoader";
import { ContextLoader } from "./shared/domain/ContextLoader";
import { HttpTokenDataSource } from "./token/data/HttpTokenDataSource";
import { TokenContextLoader } from "./token/domain/TokenContextLoader";

export class ContextModuleBuilder {
  private customLoaders: ContextLoader[] = [];
  private defaultLoaders: ContextLoader[] = [];

  constructor() {
    const tokenDataSource = new HttpTokenDataSource();
    const tokenLoader = new TokenContextLoader(tokenDataSource);
    const nftLoader = new NftContextLoader(new HttpNftDataSource());
    const forwardDomainLoader = new ForwardDomainContextLoader(new HttpForwardDomainDataSource());
    const externalPluginLoader = new ExternalPluginContextLoader(
      new HttpExternalPluginDataSource(),
      tokenDataSource,
    );

    this.defaultLoaders = [tokenLoader, nftLoader, forwardDomainLoader, externalPluginLoader];
  }

  /**
   * Remove default loaders from the list of loaders
   *
   * @returns this
   */
  withoutDefaultLoaders() {
    this.defaultLoaders = [];
    return this;
  }

  /**
   * Add a custom loader to the list of loaders
   *
   * @param loader loader to add to the list of loaders
   * @returns this
   */
  addLoader(loader: ContextLoader) {
    this.customLoaders.push(loader);
    return this;
  }

  /**
   * Build the context module
   *
   * @returns the context module
   */
  build(): ContextModule {
    const loaders = [...this.defaultLoaders, ...this.customLoaders];
    return new DefaultContextModule({ loaders });
  }
}
