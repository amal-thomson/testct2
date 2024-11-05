import { Request, Response } from 'express';
import { logger } from '../utils/logger.utils';
import { productAnalysis } from '../services/Vision AI/productAnalysis.service';
import { generateProductDescription } from '../services/Generative AI/descriptionGeneration.service';
import { ProductAttribute } from '../interfaces/productAttribute.interface';
import { createProductCustomObject } from '../repository/Custom Object/createCustomObject.repository';
import { updateCustomObjectWithDescription } from '../repository/Custom Object/updateCustomObjectWithDescription';

export const post = async (request: Request, response: Response) => {
    try {
        const pubSubMessage = request.body.message;
        const decodedData = pubSubMessage.data
            ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
            : undefined;

        if (!decodedData) {
            logger.error('❌ No data found in Pub/Sub message.');
            return response.status(400).send({ error: '❌ No data found in Pub/Sub message.' });
        }

        const jsonData = JSON.parse(decodedData);

        if (jsonData.resource?.typeId === 'product') {
            logger.info('✅ Event message received.');
            logger.info('✅ Processing event message.');
        }

        const productId = jsonData.productProjection?.id;
        const imageUrl = jsonData.productProjection?.masterVariant?.images?.[0]?.url;
        const productName = jsonData.productProjection?.name?.en || 'Product Name Missing'; 

        if (productId && imageUrl) {
            const attributes: ProductAttribute[] = jsonData.productProjection?.masterVariant?.attributes || [];
            
            if (!attributes || attributes.length === 0) {
                logger.error('❌ No attributes found in the product data.');
                return response.status(400).send({
                    error: '❌ No attributes found in the product data.',
                });
            }
            
            const genDescriptionAttr = attributes.find(attr => attr.name === 'generateDescription');
            const isGenerateDescriptionEnabled = Boolean(genDescriptionAttr?.value);

            if (!isGenerateDescriptionEnabled) {
                logger.info('❌ The option for automatic description generation is not enabled.', { productId, imageUrl });
                return response.status(200).send({
                    message: '❌ The option for automatic description generation is not enabled.',
                    productId,
                    imageUrl,
                    productName
                });
            }

            logger.info(`✅ Processing product: ${productName} (ID: ${productId})`);

            logger.info('✅ Creating custom object for product description.');
            await createProductCustomObject(productId, imageUrl, productName);

            logger.info('✅ Sending product image to Vision AI.');
            const imageData = await productAnalysis(imageUrl);

            logger.info('✅ Sending image data to Generative AI.');
            const description = await generateProductDescription(imageData);

            logger.info('✅ Updating custom object with generated description.');
            await updateCustomObjectWithDescription(productId, productName, imageUrl, description);

            logger.info('✅ Process completed successfully.');
            logger.info('⌛ Waiting for next event message.');

            return response.status(200).send({
                productId,
                productName,
                imageUrl,
                description,
                productAnalysis: imageData,
            });
        }
        
    } catch (error) {
        if (error instanceof Error) {
            logger.error('❌ Error processing request', { error: error.message });
            return response.status(500).send({
                error: '❌ Internal server error. Failed to process request.',
                details: error.message,
            });
        }
        logger.error('❌ Unexpected error', { error });
        return response.status(500).send({
            error: '❌ Unexpected error occurred.',
        });
    }
};
