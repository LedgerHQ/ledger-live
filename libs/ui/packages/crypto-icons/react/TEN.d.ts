/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function TEN({ size, color }: Props): JSX.Element;
declare namespace TEN {
    var DefaultColor: string;
}
export default TEN;
