import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const s3 = new S3Client({});
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const upload: APIGatewayProxyHandler = async (event) => {
  try {
    const { image, contentType } = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer?.claims.sub;
    const photoId = uuidv4();
    const key = `${userId}/${photoId}`;

    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.PHOTOS_BUCKET,
      Key: key,
      Body: Buffer.from(image, 'base64'),
      ContentType: contentType
    }));

    // Save metadata to DynamoDB
    await dynamodb.send(new PutCommand({
      TableName: process.env.PHOTOS_TABLE,
      Item: {
        id: photoId,
        userId,
        key,
        createdAt: new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ photoId, key })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not upload photo' })
    };
  }
};

export const list: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims.sub;

    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.PHOTOS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(result.Items)
    };
  } catch (error) {
    console.error('List error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not list photos' })
    };
  }
};

export const delete: APIGatewayProxyHandler = async (event) => {
  try {
    const photoId = event.pathParameters?.id;
    const userId = event.requestContext.authorizer?.claims.sub;

    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.PHOTOS_BUCKET,
      Key: `${userId}/${photoId}`
    }));

    // Delete from DynamoDB
    await dynamodb.send(new DeleteCommand({
      TableName: process.env.PHOTOS_TABLE,
      Key: {
        id: photoId,
        userId
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: 'Photo deleted successfully' })
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not delete photo' })
    };
  }
};