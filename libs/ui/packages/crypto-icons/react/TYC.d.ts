/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TYC({ size, color }: Props): JSX.Element;
declare namespace TYC {
    var DefaultColor: string;
}
export default TYC;
