/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ETC({ size, color }: Props): JSX.Element;
declare namespace ETC {
    var DefaultColor: string;
}
export default ETC;
