import { Test, TestingModule } from '@nestjs/testing';
import { ZohoController } from './zoho.controller';
import { ZohoService } from './zoho.service';
import { ZohoAuthService } from './zoho-auth.service';
import { Readable } from 'stream';

describe('ZohoController', () => {
  let controller: ZohoController;
  let service: ZohoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZohoController],
      providers: [
        {
          provide: ZohoService,
          useValue: {
            getEsignTags: jest.fn(),
          },
        },
        {
          provide: ZohoAuthService,
          useValue: {
            getAccessToken: jest.fn(),
            fetchAccessToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ZohoController>(ZohoController);
    service = module.get<ZohoService>(ZohoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEsignTags', () => {
    it('should return eSign tags', async () => {
      const mockTags: any = {
        tags: {
          field_types: [
            {
              field_type_id: '66919000000000173',
              field_category: 'checkbox',
              is_mandatory: false,
              field_type_name: 'Checkbox',
            },
          ],
          code: 0,
          message: 'Field types retrieved successfully',
          status: 'success',
        },
      };

      jest.spyOn(service, 'getEsignTags').mockResolvedValue(mockTags);

      const result: any = await controller.getEsignTags();
      const extractData = {
        tags: {
          field_types: result.tags.field_types[0],
          code: result.tags.code,
          message: result.tags.message,
          status: result.tags.status,
        },
      };
      expect(extractData).toEqual({
        tags: {
          field_types: expect.any(Array),
          code: expect.any(Number),
          message: expect.any(String),
          status: expect.any(String),
        },
      });
      expect(extractData.tags.field_types[0]).toEqual({
        field_type_id: expect.any(String),
        field_category: expect.any(String),
        is_mandatory: expect.any(Boolean),
        field_type_name: expect.any(String),
      });
    });

    it('should handle errors', async () => {
      jest
        .spyOn(service, 'getEsignTags')
        .mockRejectedValue(new Error('Failed to fetch eSign tags'));

      await expect(controller.getEsignTags()).rejects.toThrow(
        'Failed to fetch eSign tags',
      );
    });
  });
  describe('submitForEsign', () => {
    it('should submit a document for eSign', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-file.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1000, // size in bytes
        buffer: Buffer.from('file-content'),
        stream: Readable.from('file-content'), // Assuming you have a Readable stream
      };
      const mockRequestBody = { tags: 'tag1,tag2' };
      const mockResponse: any = { message: 'Document submitted for eSign' };

      jest.spyOn(service, 'submitForEsign').mockResolvedValue(mockResponse);

      const result = await controller.submitForEsign(mockFile, mockRequestBody);
      expect(result).toEqual(mockResponse);
    });
  });
});
