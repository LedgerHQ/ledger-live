/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ABI({ size, color }: Props): JSX.Element;
declare namespace ABI {
    var DefaultColor: string;
}
export default ABI;
