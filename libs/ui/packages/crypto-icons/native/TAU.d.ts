/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TAU({ size, color }: Props): JSX.Element;
declare namespace TAU {
    var DefaultColor: string;
}
export default TAU;
