/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AMP({ size, color }: Props): JSX.Element;
declare namespace AMP {
    var DefaultColor: string;
}
export default AMP;
