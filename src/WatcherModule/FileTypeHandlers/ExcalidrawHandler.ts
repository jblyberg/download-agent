import { Injectable } from '@nestjs/common';
import chokidar, { FSWatcher } from 'chokidar';
import { load } from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { IHandlerClass } from '../interfaces/IHandlerClass';
import { IWatcherConfig } from '../interfaces/IWatcherConfig';

@Injectable()
export class ExcalidrawHandler implements IHandlerClass {
  private CONFIG_PATH = './config/config.yml';
  private watcher: FSWatcher;
  private watcherConfig: IWatcherConfig;

  constructor() {
    const fileContents = fs.readFileSync(this.CONFIG_PATH, 'utf8');

    // Parse YAML and cast to your interface
    this.watcherConfig = load(fileContents) as IWatcherConfig;
  }

  public register_watcher() {
    this.watcher = chokidar.watch(this.watcherConfig.excalidraw.src_dir, {
      persistent: true,
      awaitWriteFinish: true,
    });

    this.watcher.on('add', async (filePath) => {
      if (path.extname(filePath).toLowerCase() === '.excalidraw') {
        //
      }
    });
  }
}
