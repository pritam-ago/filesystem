// Dev-only worker entry point.
//
// file.controller.ts spawns '../workers/uploadWorker.js'. Running from source
// that path resolves to this file; in a production build it resolves to
// dist/workers/uploadWorker.js, compiled from uploadWorker.ts, and this file is
// never loaded. So this exists purely to get the TypeScript worker running
// under tsx.
//
// Worker threads do not inherit tsx's module hooks. The old `node --loader`
// flag applied process-wide, including to workers, which is why this used to
// work; module.register() is per-thread, so the hooks have to be installed
// here before the TypeScript worker is imported.
import { register } from 'tsx/esm/api';

register();

await import('./uploadWorker.ts');
