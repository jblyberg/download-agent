import { Module } from '@nestjs/common';
import { ConfigService } from './ConfigService';
import { ExcalidrawHandler } from './FileTypeHandlers/ExcalidrawHandler';

@Module({
  imports: [],
  controllers: [],
  providers: [ConfigService, ExcalidrawHandler],
})
export class WatcherModule {}
