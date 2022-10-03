/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MONA({ size, color }: Props): JSX.Element;
declare namespace MONA {
    var DefaultColor: string;
}
export default MONA;
