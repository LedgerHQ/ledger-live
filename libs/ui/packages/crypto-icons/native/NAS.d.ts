/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NAS({ size, color }: Props): JSX.Element;
declare namespace NAS {
    var DefaultColor: string;
}
export default NAS;
