declare const _default: {
    description: string;
    args: {
        name: string;
        type: BooleanConstructor;
        desc: string;
    }[];
    job: ({ continuous }: {
        continuous?: boolean | undefined;
    }) => import("rxjs").Observable<import("@ledgerhq/live-common/lib/families/bitcoin/satstack").SatStackStatus>;
};
export default _default;
//# sourceMappingURL=satstackStatus.d.ts.map