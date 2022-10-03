/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function FSN({ size, color }: Props): JSX.Element;
declare namespace FSN {
    var DefaultColor: string;
}
export default FSN;
