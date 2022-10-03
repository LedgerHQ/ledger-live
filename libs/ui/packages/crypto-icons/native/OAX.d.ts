/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OAX({ size, color }: Props): JSX.Element;
declare namespace OAX {
    var DefaultColor: string;
}
export default OAX;
