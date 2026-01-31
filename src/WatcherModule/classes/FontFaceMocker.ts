export class FontFaceMocker {
  family: string;
  source: string | BufferSource;
  descriptors: FontFaceDescriptors;

  status: 'unloaded' | 'loading' | 'loaded' | 'error' = 'unloaded';
  // unicodeRange = '';
  // variant = 'normal';
  // featureSettings = 'normal';
  // variationSettings = 'normal';
  // display = 'auto';

  constructor(family: string, source: string | BufferSource, descriptors: FontFaceDescriptors = {}) {
    this.family = family;
    this.source = source;
    this.descriptors = descriptors;

    // Use Object.assign to bulk-apply descriptors to the class instance
    Object.assign(this, descriptors);
  }

  async load(): Promise<this> {
    this.status = 'loaded';
    return this;
  }
}
