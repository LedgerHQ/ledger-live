/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RDN({ size, color }: Props): JSX.Element;
declare namespace RDN {
    var DefaultColor: string;
}
export default RDN;
