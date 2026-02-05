/* eslint-disable @typescript-eslint/no-empty-function */
import { Injectable, Logger } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import { CanvasRenderingContext2D } from 'canvas';
import chokidar, { FSWatcher } from 'chokidar';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { FontFaceMocker } from '../classes/FontFaceMocker';
import { ConfigService } from '../ConfigService';
import { IHandlerClass } from '../interfaces/IHandlerClass';
import { IWatcherConfig } from '../interfaces/IWatcherConfig';

@Injectable()
export class ExcalidrawHandler implements IHandlerClass {
  private config: IWatcherConfig['excalidraw'];
  private logger: Logger;
  private watcher: FSWatcher;

  constructor(configService: ConfigService) {
    this.config = configService.watcherConfig.excalidraw;
    this.logger = new Logger(ExcalidrawHandler.name);

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
      CanvasRenderingContext2D: CanvasRenderingContext2D,
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('canvas-5-polyfill'); // Provides Path2D inline

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

  /**
   * Initializes the watcher upon module load
   */
  private onModuleInit() {
    for (const dir of [this.config.src_dir, this.config.dest_dir, this.config.png_dir, this.config.svg_dir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    this.register_watcher();
  }

  private async export_to_png(filePath: string, svgOuterHTML: string) {
    const fileName = path.basename(filePath);
    const baseName = path.parse(fileName).name;

    try {
      // 1. Calculate the bounding box with a temporary instance
      const tempResvg = new Resvg(svgOuterHTML);
      const bbox = tempResvg.getBBox();

      if (!bbox) throw new Error('Could not calculate bounding box');

      // 2. Map bbox (x, y, width, height) to crop (left, top, right, bottom)
      const resvg = new Resvg(svgOuterHTML, {
        crop: {
          left: bbox.x,
          top: bbox.y,
          right: bbox.x + bbox.width,
          bottom: bbox.y + bbox.height,
        },
        fitTo: {
          mode: 'zoom',
          value: 1,
        },
      });

      const pngData = resvg.render();
      const buffer = pngData.asPng();

      const outputPath = path.join(this.config.png_dir, `${baseName}.png`);
      await fs.promises.writeFile(outputPath, buffer);
      this.logger.log(`PNG created (trimmed): ${baseName}.png ✅`);
    } catch (error: any) {
      this.logger.error(`PNG Error: ${error.message}`);
    }
  }

  private async export_to_svg(filePath: string) {
    const fileName = path.basename(filePath);
    const baseName = path.parse(fileName).name;

    try {
      const { exportToSvg } = await import('@excalidraw/utils');

      // Use promises for better NestJS non-blocking performance
      const fileData = await fs.promises.readFile(filePath, 'utf8');
      const { elements, appState, files } = JSON.parse(fileData);

      const svgElement = await exportToSvg({
        // Only include elements that aren't deleted
        elements: elements.filter((el: any) => !el.isDeleted),
        appState: {
          ...appState,
          viewBackgroundColor: 'transparent',
          exportBackground: false,
          exportWithDarkMode: true,
        },
        exportPadding: 50,
        files: files || {},
      });

      // Save SVG
      await fs.promises.writeFile(path.join(this.config.svg_dir, `${baseName}.svg`), svgElement.outerHTML);

      this.logger.log(`SVG: created ${fileName} ✅`);

      return svgElement.outerHTML;
    } catch (error: any) {
      this.logger.error(`Error processing ${fileName}:`, error.message);
    }
  }

  /**
   * Registers the watcher for .excalidraw files
   */
  public register_watcher() {
    this.watcher = chokidar.watch(this.config.src_dir, {
      persistent: true,
      awaitWriteFinish: true,
    });

    this.watcher.on('add', async (filePath) => {
      const fileName = path.basename(filePath);
      const destination_filePath = path.join(this.config.dest_dir, fileName);

      if (path.extname(filePath).toLowerCase() === this.config.extension) {
        const svgOuterHTML = (await this.export_to_svg(filePath)) || '';
        await this.export_to_png(filePath, svgOuterHTML);
        await fs.promises.copyFile(filePath, destination_filePath);
        await fs.promises.unlink(filePath);
      }
    });

    this.logger.log('Excalidraw handler ready.');
  }
}
