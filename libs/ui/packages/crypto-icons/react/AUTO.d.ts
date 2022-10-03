/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function AUTO({ size, color }: Props): JSX.Element;
declare namespace AUTO {
    var DefaultColor: string;
}
export default AUTO;
