/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { FontFaceMocker } from './classes/FontFaceMocker';

@Injectable()
export class WatcherService {
  constructor() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      pretendToBeVisual: true,
    });

    const globals = {
      window: dom.window,
      document: dom.window.document,
      navigator: dom.window.navigator,
      Element: dom.window.Element,
      HTMLElement: dom.window.HTMLElement,
      HTMLCanvasElement: dom.window.HTMLCanvasElement,
      Node: dom.window.Node,
      devicePixelRatio: 1,
      FontFace: FontFaceMocker,
    };

    for (const [key, value] of Object.entries(globals)) {
      Object.defineProperty(globalThis, key, {
        value,
        writable: true,
        configurable: true,
      });
    }

    // Specifically fix the fonts property on the document
    Object.defineProperty(dom.window.document, 'fonts', {
      value: {
        add: () => {},
        addEventListener: () => {},
        check: () => true,
        has: () => true,
        load: async () => [],
        removeEventListener: () => {},
      },
      writable: true,
      configurable: true,
    });
  }
}
