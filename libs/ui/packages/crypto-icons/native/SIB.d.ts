/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SIB({ size, color }: Props): JSX.Element;
declare namespace SIB {
    var DefaultColor: string;
}
export default SIB;
