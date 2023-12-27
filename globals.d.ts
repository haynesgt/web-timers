export {};

declare global {
  const _: typeof import('lodash');
  const preact: typeof import("preact");
  interface Window {
    _: typeof import("lodash");
    preact: typeof import("preact");
  }
}