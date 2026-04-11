// No-op shim replacing sharp for Cloudflare Workers.
// Sharp uses native binaries that can't run in the Workers runtime.
// passthroughImageService means sharp is never actually called.
const pipeline = () => {
  const p = {
    resize: () => p,
    webp: () => p,
    jpeg: () => p,
    png: () => p,
    avif: () => p,
    gif: () => p,
    toBuffer: async () => new Uint8Array(0),
    toFile: async () => ({ width: 0, height: 0, format: 'jpeg', size: 0 }),
    metadata: async () => ({ width: 0, height: 0, format: 'jpeg' }),
  };
  return p;
};
pipeline.cache = () => pipeline;
pipeline.simd = () => true;
pipeline.format = {};
pipeline.versions = { vips: '0.0.0' };
pipeline.default = pipeline;

export default pipeline;
