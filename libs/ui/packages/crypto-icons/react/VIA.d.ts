/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VIA({ size, color }: Props): JSX.Element;
declare namespace VIA {
    var DefaultColor: string;
}
export default VIA;
