import { Request, Response } from 'express';
import { post } from '../../src/controllers/event.controller';
import { productAnalysis } from '../../src/services/Vision AI/productAnalysis.service';
import { generateProductDescription } from '../../src/services/Generative AI/descriptionGeneration.service';
import { updateProductDescription } from '../../src/repository/Product/product.repository';
import { logger } from '../../src/utils/logger.utils';

jest.mock('../../src/services/Vision AI/productAnalysis.service');
jest.mock('../../src/services/Generative AI/descriptionGeneration.service');
jest.mock('../../src/repository/Product/product.repository');
jest.mock('../../src/utils/logger.utils');

describe('Event Controller Unit Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockStatus = jest.fn().mockReturnThis();
    const mockSend = jest.fn().mockReturnThis();

    beforeEach(() => {
        jest.clearAllMocks();
        mockResponse = {
            status: mockStatus,
            send: mockSend
        };
    });

    test('should handle valid product update request', async () => {
        // Arrange
        const testData = {
            resource: { typeId: 'product' },
            productProjection: {
                id: 'test-id',
                masterVariant: {
                    images: [{ url: 'test-url' }],
                    attributes: [{ name: 'generateDescription', value: true }]
                }
            }
        };
        
        mockRequest = {
            body: {
                message: {
                    data: Buffer.from(JSON.stringify(testData)).toString('base64')
                }
            }
        };

        const mockImageData = { labels: 'test' };
        const mockDescription = 'Test description';
        const mockUpdateResponse = { body: { id: 'test-id' } };

        (productAnalysis as jest.Mock).mockResolvedValue(mockImageData);
        (generateProductDescription as jest.Mock).mockResolvedValue(mockDescription);
        (updateProductDescription as jest.Mock).mockResolvedValue(mockUpdateResponse);

        // Act
        await post(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(productAnalysis).toHaveBeenCalledWith('test-url');
        expect(generateProductDescription).toHaveBeenCalledWith(mockImageData);
        expect(updateProductDescription).toHaveBeenCalledWith('test-id', mockDescription);
    });

    test('should handle invalid base64 data', async () => {
        // Arrange
        mockRequest = {
            body: {
                message: {
                    data: 'invalid-base64'
                }
            }
        };

        // Act
        await post(mockRequest as Request, mockResponse as Response);

        // Assert
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            error: '❌ Internal server error. Failed to process request.'
        }));
    });
});