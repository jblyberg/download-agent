import { IWatcherConfig } from './IWatcherConfig';

export interface IHandlerClass {
  register_watcher(config: IWatcherConfig): void;
}
