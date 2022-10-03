/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BCD({ size, color }: Props): JSX.Element;
declare namespace BCD {
    var DefaultColor: string;
}
export default BCD;
