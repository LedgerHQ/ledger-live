/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VTC({ size, color }: Props): JSX.Element;
declare namespace VTC {
    var DefaultColor: string;
}
export default VTC;
