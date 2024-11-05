import { generateProductDescription } from '../../../src/services/Generative AI/descriptionGeneration.service';
import { model } from '../../../src/config/ai.config';
import { logger } from '../../../src/utils/logger.utils';

jest.mock('../../../src/config/ai.config', () => ({
    model: {
        generateContent: jest.fn()
    }
}));
jest.mock('../../../src/utils/logger.utils');

describe('Description Generation Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should generate description successfully', async () => {
        // Arrange
        const mockImageData = {
            labels: 'shirt',
            objects: 'clothing',
            colors: ['255,255,255'],
            detectedText: 'brand',
            webEntities: 'fashion'
        };

        const mockGeneratedText = 'Generated description';
        (model.generateContent as jest.Mock).mockResolvedValue({
            response: { text: () => mockGeneratedText }
        });

        // Act
        const result = await generateProductDescription(mockImageData);

        // Assert
        expect(result).toBe(mockGeneratedText);
        expect(model.generateContent).toHaveBeenCalledWith(expect.stringContaining('Image Analysis Data'));
    });
});