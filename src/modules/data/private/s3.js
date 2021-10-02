import AWS from 'aws-sdk';
import * as utils from 'noodle-utils';
import { AWS_CREDENTIALS } from '../../constants';

/**
 * Method to read s3 data
 *
 * @param {string} bucketName The bucket to interact with
 * @param {string} objectName The name of the object we're looking for
 * @returns {object} The stored data
 */
async function readData(bucketName, objectName) {
  AWS.config.update(AWS_CREDENTIALS);

  const params = {
    Bucket: bucketName,
    Key: objectName,
  };

  return new Promise((resolve, reject) => {
    new AWS.S3().getObject(params, (error, data) => {
      if (error && error.statusCode !== 404) reject(error);

      if (utils.isUndefined(data)) {
        reject();
      } else {
        resolve(JSON.parse(JSON.parse(data.Body)));
      }
    });
  });
}

/**
 * Method to write s3 data
 *
 * @param {string} bucketName The bucket to interact with
 * @param {string} objectName The name of the object we're creating
 * @param {object} data The data to write
 * @returns {object} The response from S3 after storing a new item
 */
async function writeData(bucketName, objectName, data) {
  AWS.config.update(AWS_CREDENTIALS);

  const params = {
    Bucket: bucketName,
    Key: objectName,
    Body: JSON.stringify(data),
  };

  return new Promise((resolve, reject) => {
    new AWS.S3().upload(params, (error, response) => {
      if (error) reject(error);
      resolve(response);
    });
  });
}

export { readData, writeData };
