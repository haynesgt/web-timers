export {};

declare global {
  const _: typeof import('lodash');
  interface Window {
    _: typeof import("lodash");
  }
}