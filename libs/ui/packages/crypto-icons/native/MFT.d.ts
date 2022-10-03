/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MFT({ size, color }: Props): JSX.Element;
declare namespace MFT {
    var DefaultColor: string;
}
export default MFT;
