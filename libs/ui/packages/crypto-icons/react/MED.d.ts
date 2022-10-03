/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MED({ size, color }: Props): JSX.Element;
declare namespace MED {
    var DefaultColor: string;
}
export default MED;
