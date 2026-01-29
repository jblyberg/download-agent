import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Remove the top-level import to avoid 'window is not defined'
// import { exportToSvg } from '@excalidraw/utils';
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
    // 1. Shim the environment immediately in the constructor
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    globalThis.window = dom.window as any;
    globalThis.document = dom.window.document;
    globalThis.Node = dom.window.Node;
    globalThis.Element = dom.window.Element;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.devicePixelRatio = 1;
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
          const { exportToSvg } = await import('@excalidraw/utils');

          // Use promises for better NestJS non-blocking performance
          const fileData = await fs.promises.readFile(filePath, 'utf8');
          const { elements, appState, files } = JSON.parse(fileData);

          const svgElement = await exportToSvg({
            elements,
            appState: {
              ...appState,
              viewBackgroundColor: 'transparent',
              exportBackground: false,
              exportWithDarkMode: false,
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
