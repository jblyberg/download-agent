/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { FontFaceMocker } from './classes/FontFaceMocker';
import { ExcalidrawHandler } from './FileTypeHandlers/ExcalidrawHandler';

@Injectable()
export class WatcherService {
  constructor(private excalidrawHandler: ExcalidrawHandler) {
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
    (globalThis as any).FontFace = FontFaceMocker;

    Object.defineProperty(globalThis.document, 'fonts', {
      value: {
        load: async () => [],
        check: () => true,
        add: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      writable: true,
    });
  }

  onModuleInit() {
    this.excalidrawHandler.register_watcher();
  }
}
