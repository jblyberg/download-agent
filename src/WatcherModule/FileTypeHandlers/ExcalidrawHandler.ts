import { Injectable, Logger } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import chokidar, { FSWatcher } from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
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
      const resvg = new Resvg(svgOuterHTML, {
        fitTo: {
          mode: 'zoom',
          value: 2, // 2x scaling
        },
      });

      const pngData = resvg.render();
      const buffer = pngData.asPng();

      const outputPath = path.join(this.config.png_dir, `${baseName}.png`);
      await fs.promises.writeFile(outputPath, buffer);
      this.logger.log(`PNG: created: ${baseName}.png ✅`);
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
