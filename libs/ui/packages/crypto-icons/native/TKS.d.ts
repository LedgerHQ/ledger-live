/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TKS({ size, color }: Props): JSX.Element;
declare namespace TKS {
    var DefaultColor: string;
}
export default TKS;
