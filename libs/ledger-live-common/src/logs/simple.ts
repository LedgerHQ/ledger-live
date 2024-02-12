import winston from "winston";
import { MESSAGE } from "triple-beam";
const { format } = winston;
export default format(info => {
  const padding = (info.padding && info.padding[info.level]) || "";

  if (info.data !== undefined) {
    info[MESSAGE] = `${info.level}:${padding} ${info.message} ${JSON.stringify(info.data)}`;
  } else {
    info[MESSAGE] = `${info.level}:${padding} ${info.message}`;
  }

  return info;
});
