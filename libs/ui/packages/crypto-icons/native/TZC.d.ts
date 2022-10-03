/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TZC({ size, color }: Props): JSX.Element;
declare namespace TZC {
    var DefaultColor: string;
}
export default TZC;
