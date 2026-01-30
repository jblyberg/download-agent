import { Module } from '@nestjs/common';
import { ExcalidrawHandler } from './FileTypeHandlers/ExcalidrawHandler';
import { WatcherService } from './WatcherService';

@Module({
  imports: [],
  controllers: [],
  providers: [ExcalidrawHandler, WatcherService],
})
export class WatcherModule {}
