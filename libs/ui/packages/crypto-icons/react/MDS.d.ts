/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MDS({ size, color }: Props): JSX.Element;
declare namespace MDS {
    var DefaultColor: string;
}
export default MDS;
