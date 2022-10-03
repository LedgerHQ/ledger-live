/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MKR({ size, color }: Props): JSX.Element;
declare namespace MKR {
    var DefaultColor: string;
}
export default MKR;
