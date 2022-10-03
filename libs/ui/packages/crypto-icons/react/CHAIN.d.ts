/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CHAIN({ size, color }: Props): JSX.Element;
declare namespace CHAIN {
    var DefaultColor: string;
}
export default CHAIN;
