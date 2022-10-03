/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ARN({ size, color }: Props): JSX.Element;
declare namespace ARN {
    var DefaultColor: string;
}
export default ARN;
