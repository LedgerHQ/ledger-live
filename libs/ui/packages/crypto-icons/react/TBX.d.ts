/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TBX({ size, color }: Props): JSX.Element;
declare namespace TBX {
    var DefaultColor: string;
}
export default TBX;
