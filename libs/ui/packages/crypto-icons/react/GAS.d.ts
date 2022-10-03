/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function GAS({ size, color }: Props): JSX.Element;
declare namespace GAS {
    var DefaultColor: string;
}
export default GAS;
