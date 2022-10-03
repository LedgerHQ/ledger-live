/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function WTC({ size, color }: Props): JSX.Element;
declare namespace WTC {
    var DefaultColor: string;
}
export default WTC;
