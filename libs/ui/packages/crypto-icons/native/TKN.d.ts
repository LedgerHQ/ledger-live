/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TKN({ size, color }: Props): JSX.Element;
declare namespace TKN {
    var DefaultColor: string;
}
export default TKN;
