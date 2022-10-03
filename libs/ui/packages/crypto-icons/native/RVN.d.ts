/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function RVN({ size, color }: Props): JSX.Element;
declare namespace RVN {
    var DefaultColor: string;
}
export default RVN;
