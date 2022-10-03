/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MNX({ size, color }: Props): JSX.Element;
declare namespace MNX {
    var DefaultColor: string;
}
export default MNX;
