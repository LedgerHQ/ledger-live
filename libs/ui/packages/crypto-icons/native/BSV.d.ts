/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BSV({ size, color }: Props): JSX.Element;
declare namespace BSV {
    var DefaultColor: string;
}
export default BSV;
