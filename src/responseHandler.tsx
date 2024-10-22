// responseHandler.ts

import { Response } from "express";


interface SendJSON {
  res: Response;
  statusCode?: number;
  message?: { success?: string, code?: number, error?: string };
  result?: any;
  description?: string;
  details?: { timestamp?: string; reason?: string; errorType?: 'NotFoundException' | 'ServerException', resource?: string, responseTimeMs?: number };

}


export const sendJSONResponse = ({ res, statusCode, message, result, details, description }: SendJSON) => {


  const responseObject: any = {};

  if (message) {
    responseObject.message = message;
  }
  if (result) {
    responseObject.result = result;
  }

  if (description) {
    responseObject.description = description;
  }

  if (details) {
    responseObject.details = details;
  }


  return res.status(statusCode || 200).json({ ...responseObject, details: { ...responseObject.details, timestamp: new Date().toISOString() } });
};

// Function to send success message
export const sendSuccessMessage = (res: Response, message: string) => {
  res.status(200).send(message);
};
