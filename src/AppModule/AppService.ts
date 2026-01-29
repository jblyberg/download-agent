/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import chokidar, { FSWatcher } from 'chokidar';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private SRC_DIR = path.resolve('./in');
  private DEST_DIR = path.resolve('./out');
  private SVG_DIR = path.resolve('./svg');
  private watcher: FSWatcher;

  constructor() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      pretendToBeVisual: true,
    });

    globalThis.window = dom.window as any;
    globalThis.document = dom.window.document;
    globalThis.Node = dom.window.Node;
    globalThis.Element = dom.window.Element;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.devicePixelRatio = 1;

    // Polyfill FontFace with the metadata Excalidraw's toCSS() needs
    globalThis.FontFace = class FontFace {
      family: string;
      source: string | BufferSource;
      descriptors: FontFaceDescriptors;
      status: 'unloaded' | 'loading' | 'loaded' | 'error' = 'unloaded';

      unicodeRange = '';
      variant = 'normal';
      featureSettings = 'normal';
      variationSettings = 'normal';
      display = 'auto';

      constructor(family: string, source: string | BufferSource, descriptors: FontFaceDescriptors = {}) {
        this.family = family;
        this.source = source;
        this.descriptors = descriptors;
        // Ensure unicodeRange from descriptors is used if provided
        this.unicodeRange = descriptors.unicodeRange || '';
      }

      async load() {
        this.status = 'loaded';
        return this;
      }
    } as any as typeof FontFace;

    Object.defineProperty(globalThis.document, 'fonts', {
      value: {
        load: async () => [],
        check: () => true,
        add: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
      },
      writable: true,
    });
  }

  onModuleInit() {
    for (const dir of [this.DEST_DIR, this.SVG_DIR]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.init_watchers();
  }

  private init_watchers() {
    this.watcher = chokidar.watch(this.SRC_DIR, {
      persistent: true,
      awaitWriteFinish: true,
    });

    this.watcher.on('add', async (filePath) => {
      if (path.extname(filePath).toLowerCase() === '.excalidraw') {
        const fileName = path.basename(filePath);
        const baseName = path.parse(fileName).name;

        try {
          const { exportToSvg } = await import('@excalidraw/utils'); // inline import to avoid 'window is not defined'

          // Use promises for better NestJS non-blocking performance
          const fileData = await fs.promises.readFile(filePath, 'utf8');
          const { elements, appState, files } = JSON.parse(fileData);

          const svgElement = await exportToSvg({
            elements,
            appState: {
              ...appState,
              viewBackgroundColor: 'transparent',
              exportBackground: false,
              exportWithDarkMode: true,
            },
            files: files || {}, // Use empty object, not null
          });

          // Save SVG
          await fs.promises.writeFile(path.join(this.SVG_DIR, `${baseName}.svg`), svgElement.outerHTML);

          // Move original
          await fs.promises.rename(filePath, path.join(this.DEST_DIR, fileName));

          console.log(`✅ Converted and Moved: ${fileName}`);
        } catch (error: any) {
          console.error(`❌ Error processing ${fileName}:`, error.message);
        }
      }
    });
  }

  onModuleDestroy() {
    this.watcher?.close();
  }
}
