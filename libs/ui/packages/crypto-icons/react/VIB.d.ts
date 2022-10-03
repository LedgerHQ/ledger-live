/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VIB({ size, color }: Props): JSX.Element;
declare namespace VIB {
    var DefaultColor: string;
}
export default VIB;
