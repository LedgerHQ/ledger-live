import "./pre";
import "~/renderer/experimental"; // NB loads things from process.env and setEnvs them at boot, so it must stay early
import "~/mocks/init"; // Initialize MSW (Mock Service Worker) for API mocking
import "~/renderer/init";
import { RSDOCTOR_EVAL_PAYLOAD } from "~/renderer/rsdoctorEval";

Reflect.set(globalThis, "__RSDOCTOR_EVAL__", RSDOCTOR_EVAL_PAYLOAD);
