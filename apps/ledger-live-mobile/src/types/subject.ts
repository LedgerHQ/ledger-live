import { Subject } from "rxjs";

const subject: Subject<{ row: number; list: number }> = new Subject();
export default subject;
