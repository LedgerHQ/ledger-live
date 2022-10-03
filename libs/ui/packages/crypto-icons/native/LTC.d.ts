/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LTC({ size, color }: Props): JSX.Element;
declare namespace LTC {
    var DefaultColor: string;
}
export default LTC;
