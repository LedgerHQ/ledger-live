/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DGD({ size, color }: Props): JSX.Element;
declare namespace DGD {
    var DefaultColor: string;
}
export default DGD;
