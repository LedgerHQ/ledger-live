/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CRED({ size, color }: Props): JSX.Element;
declare namespace CRED {
    var DefaultColor: string;
}
export default CRED;
