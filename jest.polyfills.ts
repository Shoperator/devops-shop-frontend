import { TextDecoder, TextEncoder } from "node:util";

/**
 * jsdom implements the DOM, not the whole web platform, and React's streaming
 * renderer expects the text encoders to be there. Node has them, so they are
 * handed over before the test environment loads any module.
 */
Object.assign(globalThis, { TextEncoder, TextDecoder });
