import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const cognito = new CognitoIdentityProviderClient({});
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const register: APIGatewayProxyHandler = async (event) => {
  try {
    const { username, email, password } = JSON.parse(event.body || '{}');

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'All fields are required' }),
      };
    }

    const userPoolId = process.env.USER_POOL_ID;

    // Create user in Cognito
    await cognito.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email, // Cognito uses email as the username by default
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'custom:username', Value: username }, // Custom attribute for username
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS'
    }));

    // Set user password
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true
    }));

    // Create user in DynamoDB
    const userId = uuidv4();
    await dynamodb.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        id: userId,
        username,
        email,
        createdAt: new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: 'User registered successfully' })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Could not register user' })
    };
  }
};

export const login: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT_ID;

    const authResponse = await cognito.send(new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email, // Cognito uses email for authentication
        PASSWORD: password
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        token: authResponse.AuthenticationResult?.IdToken,
        refreshToken: authResponse.AuthenticationResult?.RefreshToken,  // Ensure you send the refresh token as well
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Invalid credentials' })
    };
  }
};

export const refreshToken: APIGatewayProxyHandler = async (event) => {
  try {
    const { refreshToken } = JSON.parse(event.body || '{}');

    if (!refreshToken) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ error: 'Refresh token is required' }),
      };
    }

    const userPoolId = process.env.USER_POOL_ID;
    const clientId = process.env.USER_POOL_CLIENT_ID;

    const authResponse = await cognito.send(new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        token: authResponse.AuthenticationResult?.IdToken,
        refreshToken: authResponse.AuthenticationResult?.RefreshToken, // Provide the new refresh token as well
      })
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ error: 'Failed to refresh token' })
    };
  }
};
