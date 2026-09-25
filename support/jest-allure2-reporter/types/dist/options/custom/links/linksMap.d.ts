import type { KeyedLinkCustomizer, Link, MaybePromise, PropertyExtractor } from '@support/jest-allure2-reporter';
export declare function linksMap<Context>(customizer: Record<string, KeyedLinkCustomizer<Context>>): PropertyExtractor<Context, MaybePromise<Link[]>>;
