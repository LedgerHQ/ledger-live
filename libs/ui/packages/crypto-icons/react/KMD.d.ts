/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function KMD({ size, color }: Props): JSX.Element;
declare namespace KMD {
    var DefaultColor: string;
}
export default KMD;
