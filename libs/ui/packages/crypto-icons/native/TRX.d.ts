/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TRX({ size, color }: Props): JSX.Element;
declare namespace TRX {
    var DefaultColor: string;
}
export default TRX;
