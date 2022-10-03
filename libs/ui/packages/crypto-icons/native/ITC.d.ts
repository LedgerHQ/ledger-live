/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ITC({ size, color }: Props): JSX.Element;
declare namespace ITC {
    var DefaultColor: string;
}
export default ITC;
