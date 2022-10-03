/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FTC({ size, color }: Props): JSX.Element;
declare namespace FTC {
    var DefaultColor: string;
}
export default FTC;
