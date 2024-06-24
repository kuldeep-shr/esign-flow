import { IsArray, IsString } from 'class-validator';

export class GetEsignTagsDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class SubmitEsignResponseDto {
  message: string;
  url: string;
}
