/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CC({ size, color }: Props): JSX.Element;
declare namespace CC {
    var DefaultColor: string;
}
export default CC;
