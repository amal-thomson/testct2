import { updateProductDescription } from '../../../src/repository/Product/product.repository';
import { createApiRoot } from '../../../src/client/create.client';
import { logger } from '../../../src/utils/logger.utils';

jest.mock('../../../src/client/create.client');
jest.mock('../../../src/utils/logger.utils');
jest.mock('../../../src/utils/config.utils', () => ({
    readConfiguration: jest.fn().mockReturnValue({
        CTP_PROJECT_KEY: 'test-project-key',
        CTP_CLIENT_SECRET: 'test-client-secret',
        CTP_CLIENT_ID: 'test-client-id',
        CTP_AUTH_URL: 'https://auth.commercetools.com',
        CTP_API_URL: 'https://api.commercetools.com',
        CTP_SCOPES: 'test-scope'
    })
}));

describe('Product Repository Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully update product description', async () => {
        // Arrange
        const mockProduct = {
            body: {
                id: 'test-id',
                version: 1
            }
        };

        const mockUpdateResponse = {
            body: {
                id: 'test-id',
                version: 2
            }
        };

        const mockApiRoot = {
            products: jest.fn().mockReturnThis(),
            withId: jest.fn().mockReturnThis(),
            get: jest.fn().mockReturnThis(),
            post: jest.fn().mockReturnThis(),
            execute: jest.fn().mockImplementation(() => Promise.resolve(mockProduct))
        };

        (createApiRoot as jest.Mock).mockReturnValue(mockApiRoot);
        mockApiRoot.post.mockImplementation(() => ({
            execute: jest.fn().mockResolvedValue(mockUpdateResponse)
        }));

        // Act
        const result = await updateProductDescription('test-id', 'test description');

        // Assert
        expect(result).toBe(mockUpdateResponse);
        expect(createApiRoot).toHaveBeenCalled();
    });
});