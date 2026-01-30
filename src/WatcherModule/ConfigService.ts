import { Injectable, Logger } from '@nestjs/common';
import { load } from 'js-yaml';
import fs from 'node:fs';
import { IWatcherConfig } from './interfaces/IWatcherConfig';

@Injectable()
export class ConfigService {
  private CONFIG_PATH = './config/config.yml';
  private logger: Logger;
  public watcherConfig: IWatcherConfig;

  /**
   * Constructor
   */
  constructor() {
    const fileContents = fs.readFileSync(this.CONFIG_PATH, 'utf8');
    this.watcherConfig = load(fileContents) as IWatcherConfig;
    this.logger = new Logger(ConfigService.name);

    this.logger.log('Configuration loaded.');
  }
}
