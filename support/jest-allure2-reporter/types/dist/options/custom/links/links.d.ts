import type { Link, LinksCustomizer, MaybeNullish, MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function links<Context>(customizer: LinksCustomizer<Context>): PropertyExtractor<Context, MaybePromise<Link[]>>;
export declare function links<Context>(customizer: MaybeNullish<LinksCustomizer<Context>>): PropertyExtractor<Context, MaybePromise<Link[]>> | undefined;
