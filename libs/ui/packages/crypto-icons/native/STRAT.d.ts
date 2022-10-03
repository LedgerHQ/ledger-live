/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STRAT({ size, color }: Props): JSX.Element;
declare namespace STRAT {
    var DefaultColor: string;
}
export default STRAT;
