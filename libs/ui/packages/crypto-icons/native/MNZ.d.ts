/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MNZ({ size, color }: Props): JSX.Element;
declare namespace MNZ {
    var DefaultColor: string;
}
export default MNZ;
