/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CENZ({ size, color }: Props): JSX.Element;
declare namespace CENZ {
    var DefaultColor: string;
}
export default CENZ;
