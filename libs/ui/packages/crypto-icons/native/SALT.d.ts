/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SALT({ size, color }: Props): JSX.Element;
declare namespace SALT {
    var DefaultColor: string;
}
export default SALT;
