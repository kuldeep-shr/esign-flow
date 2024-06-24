import { Module } from '@nestjs/common';
import { ZohoController } from './zoho.controller';
import { ZohoService } from './zoho.service';
import { ZohoAuthService } from './zoho-auth.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [ZohoController],
  providers: [ZohoService, ZohoAuthService],
})
export class ZohoModule {}
