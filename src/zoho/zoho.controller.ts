import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { ZohoService } from './zoho.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetEsignTagsDto } from './dto/get-esign-tags.dto';

@Controller('zoho')
export class ZohoController {
  constructor(private readonly zohoService: ZohoService) {}

  @Get('get-esign-tags')
  async getEsignTags(): Promise<GetEsignTagsDto> {
    try {
      const tags = await this.zohoService.getEsignTags();
      console.log('Outside-Tags', tags);
      return tags;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch eSign tags',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('submit-for-esign')
  @UseInterceptors(FileInterceptor('file'))
  async submitForEsign(
    @UploadedFile() file: Express.Multer.File,
    @Body() requestBody: any,
  ) {
    return this.zohoService.submitForEsign(file, requestBody);
  }
}
