/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BLZ({ size, color }: Props): JSX.Element;
declare namespace BLZ {
    var DefaultColor: string;
}
export default BLZ;
