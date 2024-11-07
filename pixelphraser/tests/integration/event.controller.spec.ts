import { Request, Response } from 'express';
import { post } from '../../src/controllers/event.controller';
import { productAnalysis } from '../../src/services/Vision AI/productAnalysis.service';
import { generateProductDescription } from '../../src/services/Generative AI/descriptionGeneration.service';
import { updateCustomObjectWithDescription } from '../../src/repository/Custom Object/updateCustomObjectWithDescription';
import { ImageData } from '../../src/interfaces/imageData.interface';

// Mock modules
jest.mock('../../src/services/Vision AI/productAnalysis.service');
jest.mock('../../src/services/Generative AI/descriptionGeneration.service');
jest.mock('../../src/repository/Custom Object/updateCustomObjectWithDescription');
jest.mock('../../src/utils/logger.utils', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn()
    }
}));

describe('Event Controller Integration Tests', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockStatus = jest.fn().mockReturnThis();
    const mockSend = jest.fn().mockReturnThis();

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock request with product data
        mockRequest = {
            body: {
                message: {
                    data: Buffer.from(JSON.stringify({
                        resource: { typeId: 'product' },
                        productProjection: {
                            id: 'mock-product-id',
                            masterVariant: {
                                images: [{ url: 'https://example.com/image.jpg' }],
                                attributes: [
                                    { name: 'generateDescription', value: true }
                                ]
                            },
                            name: { 
                                'en': 'Product Name Missing'
                            }
                        }
                    })).toString('base64')
                }
            }
        };

        mockResponse = {
            status: mockStatus,
            send: mockSend
        };
    });

    describe('Success scenarios', () => {
        test('should successfully process product and generate description', async () => {
            // Arrange
            const mockImageData: ImageData = {
                labels: 'shirt, cotton',
                objects: 'clothing',
                colors: ['255, 255, 255'],
                detectedText: 'Brand Name',
                webEntities: 'fashion'
            };

            const mockDescription = 'A beautiful white cotton shirt';
            const mockUpdateResponse = {
                body: {
                    container: 'temporaryDescription',
                    key: 'mock-product-id',
                    value: {
                        temporaryDescription: mockDescription,
                        imageUrl: 'https://example.com/image.jpg',
                        productName: 'Product Name Missing',
                        generatedAt: expect.any(String)
                    },
                    version: 1
                }
            };

            (productAnalysis as jest.Mock).mockResolvedValue(mockImageData);
            (generateProductDescription as jest.Mock).mockResolvedValue(mockDescription);
            (updateCustomObjectWithDescription as jest.Mock).mockResolvedValue(mockUpdateResponse);

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalledWith({
                productId: 'mock-product-id',
                imageUrl: 'https://example.com/image.jpg',
                description: mockDescription,
                productAnalysis: mockImageData,
                productName: 'Product Name Missing'
            });
        });
    });

    describe('Error scenarios', () => {
        test('should return 400 when no PubSub message data is present', async () => {
            // Arrange
            mockRequest.body.message.data = undefined;

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockSend).toHaveBeenCalledWith({
                error: '❌ No data found in Pub/Sub message.'
            });
        });

        test('should return 400 when generateDescription attribute is false', async () => {
            // Arrange
            mockRequest.body.message.data = Buffer.from(JSON.stringify({
                resource: { typeId: 'product' },
                productProjection: {
                    id: 'mock-product-id',
                    masterVariant: {
                        images: [{ url: 'https://example.com/image.jpg' }],
                        attributes: [
                            { name: 'generateDescription', value: false }
                        ]
                    },
                    name: {
                        'en': 'Product Name Missing'
                    }
                }
            })).toString('base64');

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockSend).toHaveBeenCalledWith({
                message: '❌ The option for automatic description generation is not enabled.',
                productId: 'mock-product-id',
                imageUrl: 'https://example.com/image.jpg',
                productName: 'Product Name Missing'
            });
        });

        test('should return 400 when no attributes are found', async () => {
            // Arrange
            mockRequest.body.message.data = Buffer.from(JSON.stringify({
                resource: { typeId: 'product' },
                productProjection: {
                    id: 'mock-product-id',
                    masterVariant: {
                        images: [{ url: 'https://example.com/image.jpg' }],
                        attributes: []
                    }
                }
            })).toString('base64');

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockSend).toHaveBeenCalledWith({
                error: '❌ No attributes found in the product data.'
            });
        });

        test('should handle Vision AI service error', async () => {
            // Arrange
            (productAnalysis as jest.Mock).mockRejectedValue(new Error('Vision AI failed'));

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalledWith({
                error: '❌ Internal server error. Failed to process request.',
                details: 'Vision AI failed'
            });
        });

        test('should handle Generative AI service error', async () => {
            // Arrange
            const mockImageData: ImageData = {
                labels: 'shirt, cotton',
                objects: 'clothing',
                colors: ['255, 255, 255'],
                detectedText: 'Brand Name',
                webEntities: 'fashion'
            };
            
            (productAnalysis as jest.Mock).mockResolvedValue(mockImageData);
            (generateProductDescription as jest.Mock).mockRejectedValue(new Error('Generative AI failed'));

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalledWith({
                error: '❌ Internal server error. Failed to process request.',
                details: 'Generative AI failed'
            });
        });

        test('should handle Custom Object update error', async () => {
            // Arrange
            const mockImageData: ImageData = {
                labels: 'shirt, cotton',
                objects: 'clothing',
                colors: ['255, 255, 255'],
                detectedText: 'Brand Name',
                webEntities: 'fashion'
            };
            const mockDescription = 'A beautiful white cotton shirt';

            (productAnalysis as jest.Mock).mockResolvedValue(mockImageData);
            (generateProductDescription as jest.Mock).mockResolvedValue(mockDescription);
            (updateCustomObjectWithDescription as jest.Mock).mockRejectedValue(new Error('Custom Object update failed'));

            // Act
            await post(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockSend).toHaveBeenCalledWith({
                error: '❌ Internal server error. Failed to process request.',
                details: 'Custom Object update failed'
            });
        });
    });
});