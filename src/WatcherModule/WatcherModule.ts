import { Module } from '@nestjs/common';
import { ConfigService } from './ConfigService';
import { ExcalidrawHandler } from './FileTypeHandlers/ExcalidrawHandler';
import { WatcherService } from './WatcherService';

@Module({
  imports: [],
  controllers: [],
  providers: [ConfigService, ExcalidrawHandler, WatcherService],
})
export class WatcherModule {}
