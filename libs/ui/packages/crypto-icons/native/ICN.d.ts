/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ICN({ size, color }: Props): JSX.Element;
declare namespace ICN {
    var DefaultColor: string;
}
export default ICN;
